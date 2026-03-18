const Message = require('../models/Message');
const User = require('../models/User');

const connectedUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_room', async ({ room, username }) => {
      socket.join(room);
      connectedUsers.set(socket.id, { username, room });

      await User.findOneAndUpdate({ username }, { isOnline: true });

      const roomUsernames = [...connectedUsers.values()]
        .filter(u => u.room === room).map(u => u.username);
      const usersData = await User.find({ username: { $in: roomUsernames } }, 'username isOnline');
      io.to(room).emit('online_users', usersData);

      socket.to(room).emit('user_joined', `${username} joined`);
      const sys = await new Message({ room, type: 'system', message: `${username} joined the room` }).save();
      io.to(room).emit('receive_message', { type: 'system', message: sys.message, timestamp: sys.timestamp, id: sys._id });
    });

    socket.on('send_message', async ({ user, message, room, type = 'text', attachment }) => {
      const saved = await new Message({ user, message, room, type, attachment }).save();
      io.to(room).emit('receive_message', {
        user, message, room, type, attachment,
        timestamp: saved.timestamp,
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
      msg.reactions.set(emoji, users.includes(user)
        ? users.filter(u => u !== user)
        : [...users, user]);
      await msg.save();
      io.to(msg.room).emit('message_reacted', { messageId, reactions: Object.fromEntries(msg.reactions) });
    });

    socket.on('typing', (data) => socket.to(data.room).emit('user_typing', data));
    socket.on('stop_typing', (data) => socket.to(data.room).emit('user_stop_typing', data));

    socket.on('disconnect', async () => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      await User.findOneAndUpdate({ username: user.username }, { isOnline: false, lastSeen: new Date() });
      connectedUsers.delete(socket.id);

      const roomUsernames = [...connectedUsers.values()]
        .filter(u => u.room === user.room).map(u => u.username);
      const usersData = await User.find({ username: { $in: roomUsernames } }, 'username isOnline');
      io.to(user.room).emit('online_users', usersData);

      socket.to(user.room).emit('user_left', `${user.username} left`);
      const sys = await new Message({ room: user.room, type: 'system', message: `${user.username} left the room` }).save();
      io.to(user.room).emit('receive_message', { type: 'system', message: sys.message, timestamp: sys.timestamp, id: sys._id });

      console.log('Socket disconnected:', socket.id);
    });
  });
};
