const Message = require('../models/Message');
const User = require('../models/User');

const connectedUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', async (data) => {
      const { room, username } = data;
      socket.join(room);
      
      connectedUsers.set(socket.id, { username, room });
      
      // Update user online status
      await User.findOneAndUpdate({ username }, { isOnline: true });
      
      // Broadcast online users to room with lastSeen info
      const roomUsers = Array.from(connectedUsers.values())
        .filter(user => user.room === room)
        .map(user => user.username);
      const usersData = await User.find({ username: { $in: roomUsers } }, 'username lastSeen isOnline');
      io.to(room).emit('online_users', usersData);
      
      socket.to(room).emit('user_joined', `${username} joined the room`);
      // save and broadcast system message
      const sys = new Message({ room, type: 'system', message: `${username} joined the room` });
      await sys.save();
      io.to(room).emit('receive_message', { type: 'system', message: sys.message, timestamp: sys.timestamp, id: sys._id });
    });

    socket.on('send_message', async (data) => {
      const { user, message, room, type = 'text', attachment } = data;
      
      // Save message to database
      const newMessage = new Message({ user, message, room, type, attachment });
      await newMessage.save();
      
      // Broadcast message to room
      io.to(room).emit('receive_message', {
        user,
        message,
        room,
        timestamp: newMessage.timestamp,
        id: newMessage._id,
        type,
        attachment
      });
    });

    socket.on('delete_message', async (data) => {
      const { messageId, room } = data;
      await Message.findByIdAndDelete(messageId);
      io.to(room).emit('message_deleted', { messageId });
    });

    // reaction toggling
    socket.on('react_message', async (data) => {
      const { messageId, emoji, user } = data;
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const reactions = msg.reactions || new Map();
      const users = reactions.get(emoji) || [];
      if (users.includes(user)) {
        // remove
        msg.reactions.set(emoji, users.filter(u => u !== user));
      } else {
        users.push(user);
        msg.reactions.set(emoji, users);
      }
      await msg.save();
      io.to(msg.room).emit('message_reacted', { messageId, reactions: Object.fromEntries(msg.reactions) });
    });

    socket.on('typing', (data) => {
      socket.to(data.room).emit('user_typing', data);
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.room).emit('user_stop_typing', data);
    });

    socket.on('disconnect', async () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        // Update user offline status + last seen
        await User.findOneAndUpdate({ username: user.username }, { isOnline: false, lastSeen: new Date() });
        
        // Remove from connected users
        connectedUsers.delete(socket.id);
        
        // Update online users in room
        const roomUsers = Array.from(connectedUsers.values())
          .filter(u => u.room === user.room)
          .map(u => u.username);
        const usersData2 = await User.find({ username: { $in: roomUsers } }, 'username lastSeen isOnline');
        io.to(user.room).emit('online_users', usersData2);
        socket.to(user.room).emit('user_left', `${user.username} left the room`);
        // also send system message
        const sysMsg = new Message({ room: user.room, type: 'system', message: `${user.username} left the room`});
        await sysMsg.save();
        io.to(user.room).emit('receive_message', { type: 'system', message: sysMsg.message, timestamp: sysMsg.timestamp, id: sysMsg._id });
      }
      console.log('User disconnected:', socket.id);
    });
  });
};