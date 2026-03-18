const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    res.json(await Room.find());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    const room = await new Room({ name, description, createdBy }).save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
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
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a room
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a single message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Deleted', id: req.params.messageId, room: msg.room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
