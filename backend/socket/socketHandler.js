const Message = require('../models/Message');
const Room = require('../models/Room');
const Session = require('../models/Session');
const { loadActiveSession } = require('../middleware/auth');
const { parseBearerToken } = require('../utils/auth');
const { isSafeUrl, sanitizeText } = require('../utils/validation');

const generateRandomName = () => {
  const adjectives = ['Swift', 'Silent', 'Mystic', 'Cosmic', 'Phantom', 'Shadow', 'Rogue', 'Cipher', 'Nexus', 'Vortex'];
  const nouns = ['Fox', 'Wolf', 'Eagle', 'Dragon', 'Phoenix', 'Tiger', 'Raven', 'Viper', 'Storm', 'Blade'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
};

const connectedUsers = new Map(); // socketId -> { userId, username, roomId, joinedRoom }
const roomPresence = new Map(); // roomId -> Map<userId, { username, sockets: Set<socketId> }>
const rateWindows = new Map(); // key -> { start, count }
const roomTrimState = new Map(); // roomId -> { sentSinceTrim, lastTrimAt, inFlight, pending }
const roomEmitQueues = new Map(); // roomId -> { items, timer }

const MSG_LIMIT = 150;
const MAX_TEXT_LEN = 500;
const TRIM_EVERY_N_MESSAGES = 20;
const TRIM_MAX_INTERVAL_MS = 5000;
const TRIM_DELETE_BATCH_LIMIT = 1000;
const EMIT_BATCH_WINDOW_MS = 30;
const EMIT_BATCH_MAX = 30;

const RATE_LIMITS = {
  joinRoom: { max: 5, windowMs: 10000 },
  sendMessage: { max: 30, windowMs: 10000 },
  typing: { max: 40, windowMs: 10000 }
};

const checkRateLimit = (key, { max, windowMs }) => {
  const now = Date.now();
  const current = rateWindows.get(key);

  if (!current || now - current.start >= windowMs) {
    rateWindows.set(key, { start: now, count: 1 });
    return false;
  }

  if (current.count >= max) return true;
  current.count += 1;
  rateWindows.set(key, current);
  return false;
};

const getRoomUsernames = (roomId) => {
  const users = roomPresence.get(roomId);
  if (!users) return [];
  return [...users.values()].map((item) => item.displayName);
};

const upsertPresence = (roomId, userId, displayName, socketId) => {
  let roomUsers = roomPresence.get(roomId);
  if (!roomUsers) {
    roomUsers = new Map();
    roomPresence.set(roomId, roomUsers);
  }

  const existing = roomUsers.get(userId);
  if (!existing) {
    roomUsers.set(userId, { displayName, sockets: new Set([socketId]) });
    return { becameOnline: true };
  }

  existing.sockets.add(socketId);
  roomUsers.set(userId, existing);
  return { becameOnline: false };
};

const removePresence = (roomId, userId, socketId) => {
  const roomUsers = roomPresence.get(roomId);
  if (!roomUsers) return { becameOffline: false };

  const existing = roomUsers.get(userId);
  if (!existing) return { becameOffline: false };

  existing.sockets.delete(socketId);
  if (existing.sockets.size === 0) {
    roomUsers.delete(userId);
    if (roomUsers.size === 0) roomPresence.delete(roomId);
    return { becameOffline: true };
  }

  roomUsers.set(userId, existing);
  return { becameOffline: false };
};

const socketError = (socket, code, message) => {
  socket.emit('socket_error', { code, message });
};

const getTrimState = (roomId) => {
  const existing = roomTrimState.get(roomId);
  if (existing) return existing;
  const created = {
    sentSinceTrim: 0,
    lastTrimAt: 0,
    inFlight: false,
    pending: false
  };
  roomTrimState.set(roomId, created);
  return created;
};

const trimRoomMessages = async (roomId, state) => {
  if (state.inFlight) {
    state.pending = true;
    return;
  }

  state.inFlight = true;
  state.lastTrimAt = Date.now();
  state.sentSinceTrim = 0;

  try {
    const count = await Message.countDocuments({ room: roomId });
    if (count <= MSG_LIMIT) return;

    const overflowCount = count - MSG_LIMIT;
    const toDelete = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .limit(Math.min(overflowCount, TRIM_DELETE_BATCH_LIMIT))
      .select('_id')
      .lean();

    if (toDelete.length > 0) {
      await Message.deleteMany({ _id: { $in: toDelete.map((doc) => doc._id) } });
    }

    if (overflowCount > TRIM_DELETE_BATCH_LIMIT) {
      state.pending = true;
    }
  } catch (_) {
    // keep socket flow resilient; trim retry will happen on next cycle
  } finally {
    state.inFlight = false;
    if (state.pending) {
      state.pending = false;
      setTimeout(() => {
        trimRoomMessages(roomId, state).catch(() => {});
      }, 100).unref();
    }
  }
};

const scheduleTrim = (roomId) => {
  const state = getTrimState(roomId);
  state.sentSinceTrim += 1;

  const now = Date.now();
  const shouldTrim = state.sentSinceTrim >= TRIM_EVERY_N_MESSAGES
    || (now - state.lastTrimAt) >= TRIM_MAX_INTERVAL_MS;

  if (!shouldTrim) return;
  trimRoomMessages(roomId, state).catch(() => {});
};

const flushRoomEmitQueue = (io, roomId) => {
  const queue = roomEmitQueues.get(roomId);
  if (!queue || queue.items.length === 0) return;

  if (queue.timer) {
    clearTimeout(queue.timer);
    queue.timer = null;
  }

  const batch = queue.items.splice(0, queue.items.length);
  if (batch.length === 1) {
    io.to(roomId).emit('receive_message', batch[0]);
  } else {
    io.to(roomId).emit('receive_messages_batch', batch);
  }
};

const enqueueRoomMessage = (io, roomId, payload) => {
  let queue = roomEmitQueues.get(roomId);
  if (!queue) {
    queue = { items: [], timer: null };
    roomEmitQueues.set(roomId, queue);
  }

  queue.items.push(payload);

  if (queue.items.length >= EMIT_BATCH_MAX) {
    flushRoomEmitQueue(io, roomId);
    return;
  }

  if (!queue.timer) {
    queue.timer = setTimeout(() => {
      flushRoomEmitQueue(io, roomId);
    }, EMIT_BATCH_WINDOW_MS);
    queue.timer.unref?.();
  }
};

const clearSocketRateWindows = (socketId) => {
  for (const key of rateWindows.keys()) {
    if (key.endsWith(`:${socketId}`)) {
      rateWindows.delete(key);
    }
  }
};

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake?.auth?.token
        || parseBearerToken(socket.handshake?.headers?.authorization);

      if (!authToken) return next(new Error('Missing token'));
      const { payload, session } = await loadActiveSession(authToken);

      socket.auth = {
        userId: payload.userId,
        username: payload.username,
        roomId: payload.roomId,
        sessionId: payload.sid,
        isAdmin: session.isAdmin === true,
        displayName: session.isAdmin === true ? generateRandomName() : payload.username
      };

      Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
      return next();
    } catch (_) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    connectedUsers.set(socket.id, {
      userId: socket.auth.userId,
      username: socket.auth.username,
      displayName: socket.auth.displayName,
      roomId: socket.auth.roomId,
      joinedRoom: null
    });

    socket.on('join_room', async (payload = {}) => {
      try {
        if (checkRateLimit(`join:${socket.id}`, RATE_LIMITS.joinRoom)) {
          return socketError(socket, 'RATE_LIMIT_JOIN', 'Too many join attempts. Try again shortly.');
        }

        const room = sanitizeText(payload.room);
        if (!room) return socketError(socket, 'INVALID_ROOM', 'Room is required.');
        if (room !== socket.auth.roomId) return socketError(socket, 'ROOM_FORBIDDEN', 'Access denied to this room.');

        const roomExists = await Room.exists({ name: room });
        if (!roomExists) return socketError(socket, 'ROOM_NOT_FOUND', 'Room does not exist.');

        const userState = connectedUsers.get(socket.id);
        if (!userState) return;
        if (userState.joinedRoom === room) return;

        if (userState.joinedRoom && userState.joinedRoom !== room) {
          socket.leave(userState.joinedRoom);
          const oldPresence = removePresence(userState.joinedRoom, userState.userId, socket.id);
          io.to(userState.joinedRoom).emit('online_users', getRoomUsernames(userState.joinedRoom));

          if (oldPresence.becameOffline) {
            const left = await new Message({
              room: userState.joinedRoom,
              type: 'system',
              message: `${userState.displayName} left`
            }).save();

            io.to(userState.joinedRoom).emit('receive_message', {
              type: 'system',
              message: left.message,
              room: userState.joinedRoom,
              timestamp: left.createdAt,
              id: left._id
            });
          }
        }

        socket.join(room);
        userState.joinedRoom = room;
        connectedUsers.set(socket.id, userState);

        const presence = upsertPresence(room, userState.userId, userState.displayName, socket.id);
        io.to(room).emit('online_users', getRoomUsernames(room));

        if (presence.becameOnline) {
          const joined = await new Message({ room, type: 'system', message: `${userState.displayName} joined` }).save();
          io.to(room).emit('receive_message', {
            type: 'system',
            message: joined.message,
            room,
            timestamp: joined.createdAt,
            id: joined._id
          });
        }
      } catch (err) {
        socketError(socket, 'JOIN_FAILED', err.message || 'Join failed');
      }
    });

    socket.on('send_message', async (payload = {}) => {
      try {
        if (checkRateLimit(`msg:${socket.id}`, RATE_LIMITS.sendMessage)) {
          return socketError(socket, 'RATE_LIMIT_MESSAGE', 'You are sending messages too quickly.');
        }

        const userState = connectedUsers.get(socket.id);
        if (!userState?.joinedRoom) {
          return socketError(socket, 'NOT_IN_ROOM', 'Join the room before sending messages.');
        }

        const room = sanitizeText(payload.room);
        if (!room || room !== userState.joinedRoom) {
          return socketError(socket, 'ROOM_FORBIDDEN', 'Cannot send to this room.');
        }

        const type = payload.type === 'gif' ? 'gif' : 'text';
        const rawMessage = type === 'text' ? sanitizeText(payload.message) : '';
        const attachment = type === 'gif' ? String(payload.attachment || '') : undefined;

        if (type === 'text' && (!rawMessage || rawMessage.length > MAX_TEXT_LEN)) {
          return socketError(socket, 'INVALID_MESSAGE', 'Message must be 1 to 500 characters.');
        }

        if (type === 'gif' && !isSafeUrl(attachment)) {
          return socketError(socket, 'INVALID_GIF', 'Invalid GIF URL.');
        }

        const saved = await new Message({
          user: userState.displayName || userState.username,
          message: rawMessage,
          room,
          type,
          attachment
        }).save();

        scheduleTrim(room);

        enqueueRoomMessage(io, room, {
          user: userState.displayName || userState.username,
          message: rawMessage,
          room,
          type,
          attachment,
          timestamp: saved.createdAt,
          id: saved._id
        });
      } catch (err) {
        socketError(socket, 'SEND_FAILED', err.message || 'Message send failed');
      }
    });

    socket.on('delete_message', async ({ messageId, room } = {}) => {
      try {
        const userState = connectedUsers.get(socket.id);
        if (!userState?.joinedRoom || room !== userState.joinedRoom) {
          return socketError(socket, 'ROOM_FORBIDDEN', 'Cannot delete from this room.');
        }

        const msg = await Message.findById(messageId);
        if (!msg) return socketError(socket, 'NOT_FOUND', 'Message not found.');
        if (msg.room !== room) {
          return socketError(socket, 'FORBIDDEN', 'Message not in this room.');
        }

        // Admin can delete any message, users can only delete their own
        const isAdmin = socket.auth.isAdmin;
        const isOwner = msg.user === userState.displayName || msg.user === userState.username;
        
        if (!isAdmin && !isOwner) {
          return socketError(socket, 'FORBIDDEN', 'You can only delete your own messages.');
        }

        await Message.deleteOne({ _id: messageId });
        io.to(room).emit('message_deleted', { messageId });
      } catch (err) {
        socketError(socket, 'DELETE_FAILED', err.message || 'Delete failed');
      }
    });

    socket.on('react_message', async ({ messageId, emoji } = {}) => {
      try {
        const userState = connectedUsers.get(socket.id);
        if (!userState?.joinedRoom) return;
        if (!emoji || typeof emoji !== 'string' || emoji.length > 16) return;

        const msg = await Message.findById(messageId);
        if (!msg || msg.room !== userState.joinedRoom) return;

        const users = msg.reactions.get(emoji) || [];
        const username = userState.username;
        msg.reactions.set(emoji, users.includes(username) ? users.filter((u) => u !== username) : [...users, username]);
        await msg.save();
        io.to(msg.room).emit('message_reacted', { messageId, reactions: Object.fromEntries(msg.reactions) });
      } catch (_) {}
    });

    socket.on('typing', (data = {}) => {
      if (checkRateLimit(`typing:${socket.id}`, RATE_LIMITS.typing)) return;
      const userState = connectedUsers.get(socket.id);
      if (!userState?.joinedRoom || data.room !== userState.joinedRoom) return;
      socket.to(data.room).emit('user_typing', { room: data.room, username: userState.displayName });
    });

    socket.on('stop_typing', (data = {}) => {
      const userState = connectedUsers.get(socket.id);
      if (!userState?.joinedRoom || data.room !== userState.joinedRoom) return;
      socket.to(data.room).emit('user_stop_typing', { room: data.room, username: userState.displayName });
    });

    socket.on('disconnect', async () => {
      try {
        clearSocketRateWindows(socket.id);

        const user = connectedUsers.get(socket.id);
        connectedUsers.delete(socket.id);
        if (!user?.joinedRoom) return;

        const presence = removePresence(user.joinedRoom, user.userId, socket.id);
        io.to(user.joinedRoom).emit('online_users', getRoomUsernames(user.joinedRoom));

        if (presence.becameOffline) {
          const left = await new Message({
            room: user.joinedRoom,
            type: 'system',
            message: `${user.displayName} left`
          }).save();

          io.to(user.joinedRoom).emit('receive_message', {
            type: 'system',
            message: left.message,
            room: user.joinedRoom,
            timestamp: left.createdAt,
            id: left._id
          });
        }
      } catch (_) {}
    });
  });
};
