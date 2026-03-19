const Message = require('../models/Message');

const connectedUsers = new Map(); // socketId → { username, room }
const MSG_LIMIT = 150;

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', async ({ room, username }) => {
      socket.join(room);
      connectedUsers.set(socket.id, { username, room });

      const roomUsers = [...connectedUsers.values()]
        .filter(u => u.room === room).map(u => u.username);
      io.to(room).emit('online_users', roomUsers);

      const sys = await new Message({ room, type: 'system', message: `${username} joined` }).save();
      io.to(room).emit('receive_message', { type: 'system', message: sys.message, timestamp: sys.createdAt, id: sys._id });
    });

    socket.on('send_message', async ({ user, message, room, type = 'text', attachment }) => {
      if (!message || message.length > 500) return;

      const saved = await new Message({ user, message, room, type, attachment }).save();

      // Enforce 150-message cap — delete oldest if over limit
      const count = await Message.countDocuments({ room });
      if (count > MSG_LIMIT) {
        const oldest = await Message.find({ room }).sort({ createdAt: 1 }).limit(count - MSG_LIMIT);
        await Message.deleteMany({ _id: { $in: oldest.map(m => m._id) } });
      }

      io.to(room).emit('receive_message', {
        user, message, room, type, attachment,
        timestamp: saved.createdAt,
        id: saved._id
      });
    });

    socket.on('delete_message', async ({ messageId, room }) => {
      await Message.findByIdAndDelete(messageId);
      io.to(room).emit('message_deleted', { messageId });
    });

    socket.on('react_message', async ({ messageId, emoji, user }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const users = msg.reactions.get(emoji) || [];
      msg.reactions.set(emoji, users.includes(user) ? users.filter(u => u !== user) : [...users, user]);
      await msg.save();
      io.to(msg.room).emit('message_reacted', { messageId, reactions: Object.fromEntries(msg.reactions) });
    });

    socket.on('typing', (data) => socket.to(data.room).emit('user_typing', data));
    socket.on('stop_typing', (data) => socket.to(data.room).emit('user_stop_typing', data));

    socket.on('disconnect', async () => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      connectedUsers.delete(socket.id);

      const roomUsers = [...connectedUsers.values()]
        .filter(u => u.room === user.room).map(u => u.username);
      io.to(user.room).emit('online_users', roomUsers);

      const sys = await new Message({ room: user.room, type: 'system', message: `${user.username} left` }).save();
      io.to(user.room).emit('receive_message', { type: 'system', message: sys.message, timestamp: sys.createdAt, id: sys._id });
    });
  });
};
