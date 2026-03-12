const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    const room = new Room({ name, description, createdBy });
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete room (and its messages)
router.delete('/:roomId', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await Message.deleteMany({ room: room.name });
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a room
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// delete a message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted', id: req.params.messageId, room: msg.room });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;