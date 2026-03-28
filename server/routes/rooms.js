const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');

const router = express.Router();
const MSG_LIMIT = 150;

// Get all rooms
router.get('/', async (req, res) => {
  try {
    res.json(await Room.find({}, 'name description'));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const { name, description, passcode, createdBy } = req.body;
    const room = await new Room({ name, description, passcode, createdBy }).save();
    res.json({ name: room.name, description: room.description });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Delete room + its messages
router.delete('/:roomId', async (req, res) => {
  try {
    let room = null;
    try { room = await Room.findByIdAndDelete(req.params.roomId); } catch (_) {}
    if (!room) room = await Room.findOneAndDelete({ name: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await Message.deleteMany({ room: room.name });
    res.json({ message: 'Room deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Get last 150 messages for a room
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .sort({ createdAt: -1 }).limit(MSG_LIMIT).lean();
    res.json(messages.reverse());
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Delete a single message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Deleted', id: req.params.messageId, room: msg.room });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
