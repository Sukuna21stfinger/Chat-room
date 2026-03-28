const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');
const { isValidRoomId, sanitizeText } = require('../utils/validation');

const router = express.Router();
const MSG_LIMIT = 150;

router.use(requireAuth);

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({}, 'name description createdBy isGeneral').lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    const description = sanitizeText(req.body?.description || '');
    const passcode = String(req.body?.passcode || '');

    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Room name must be at least 2 characters' });
    }

    if (!isValidRoomId(name)) {
      return res.status(400).json({ message: 'Invalid room name format' });
    }

    // Check if room already exists
    const existing = await Room.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Room already exists' });
    }

    const room = await new Room({
      name,
      description,
      passcode,
      createdBy: req.auth.username,
      isGeneral: false,
      lastActivityAt: new Date()
    }).save();

    res.status(201).json({
      _id: room._id,
      name: room.name,
      description: room.description,
      createdBy: room.createdBy
    });
  } catch (err) {
    console.error('Create room error:', err.message);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

// Delete room + its messages
router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find room by ID or name
    let room = null;
    try {
      room = await Room.findById(roomId);
    } catch (_) {}

    if (!room) {
      room = await Room.findOne({ name: roomId });
    }

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check permissions - ADMIN CAN DELETE ANYTHING (except THE RED ROOM)
    const isAdmin = req.auth.isAdmin;
    const isCreator = room.createdBy === req.auth.username;
    const isGeneralRoom = room.isGeneral || room.name === 'THE RED ROOM';

    // THE RED ROOM cannot be deleted
    if (isGeneralRoom) {
      return res.status(403).json({ message: 'THE RED ROOM is permanent and cannot be deleted' });
    }

    // Admin can delete any custom room
    if (isAdmin) {
      await Room.deleteOne({ _id: room._id });
      await Message.deleteMany({ room: room.name });
      return res.json({ message: 'Room deleted successfully by admin', roomName: room.name });
    }

    // Non-admin: only creator can delete custom rooms
    if (!isCreator) {
      return res.status(403).json({ message: 'Only room creator can delete this room' });
    }

    // Delete room and its messages
    await Room.deleteOne({ _id: room._id });
    await Message.deleteMany({ room: room.name });

    res.json({ message: 'Room deleted successfully', roomName: room.name });
  } catch (err) {
    console.error('Delete room error:', err.message);
    res.status(500).json({ message: 'Failed to delete room' });
  }
});

// Get last 150 messages for a room
router.get('/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;

    // Only get messages that haven't expired (created within last 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const messages = await Message.find({
      room: roomId,
      createdAt: { $gte: thirtyMinsAgo }
    })
      .sort({ createdAt: -1 })
      .limit(MSG_LIMIT)
      .lean();

    res.json(messages.reverse());
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Delete a single message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Admin can delete any message, users can only delete their own
    if (!req.auth.isAdmin && msg.user !== req.auth.username) {
      return res.status(403).json({ message: 'Can only delete your own messages' });
    }

    await Message.deleteOne({ _id: messageId });
    res.json({ message: 'Message deleted', id: messageId, room: msg.room });
  } catch (err) {
    console.error('Delete message error:', err.message);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Admin: Kick user from room
router.post('/admin/kick-user', async (req, res) => {
  try {
    if (!req.auth.isAdmin) {
      return res.status(403).json({ message: 'Only admin can kick users' });
    }

    const { username, roomId } = req.body;

    if (!username || !roomId) {
      return res.status(400).json({ message: 'username and roomId required' });
    }

    // Revoke all sessions for this user in this room
    const result = await Session.updateMany(
      { username, roomId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: 'kicked_by_admin' } }
    );

    res.json({
      message: `User ${username} kicked from ${roomId}`,
      sessionsRevoked: result.modifiedCount
    });
  } catch (err) {
    console.error('Kick user error:', err.message);
    res.status(500).json({ message: 'Failed to kick user' });
  }
});

// Admin: Get all online users
router.get('/admin/online-users', async (req, res) => {
  try {
    if (!req.auth.isAdmin) {
      return res.status(403).json({ message: 'Only admin can view all users' });
    }

    const sessions = await Session.find({
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).lean();

    const users = sessions.map(s => ({
      username: s.username,
      roomId: s.roomId,
      sessionId: s.sessionId
    }));

    res.json(users);
  } catch (err) {
    console.error('Get online users error:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin: Clear all messages in a room
router.post('/admin/clear-room', async (req, res) => {
  try {
    if (!req.auth.isAdmin) {
      return res.status(403).json({ message: 'Only admin can clear rooms' });
    }

    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId required' });
    }

    const result = await Message.deleteMany({ room: roomId });

    res.json({
      message: `Cleared ${result.deletedCount} messages from ${roomId}`
    });
  } catch (err) {
    console.error('Clear room error:', err.message);
    res.status(500).json({ message: 'Failed to clear room' });
  }
});

module.exports = router;
