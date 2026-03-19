require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Room = require('../models/Room');

const router = express.Router();

// Anonymous join — POST /api/auth/join
// Body: { username, roomId, passcode? }
router.post('/join', async (req, res) => {
  try {
    const { username, roomId, passcode = '' } = req.body;

    if (!username || !roomId)
      return res.status(400).json({ message: 'username and roomId are required' });

    if (username.length > 30)
      return res.status(400).json({ message: 'Username too long' });

    // Passcode check
    const room = await Room.findOne({ name: roomId });
    if (room && room.passcode && room.passcode !== passcode)
      return res.status(403).json({ message: 'Wrong room passcode' });

    const userId = uuidv4();
    await new User({ userId, username, isOnline: true }).save();

    const token = jwt.sign({ userId, username, roomId }, process.env.JWT_SECRET, { expiresIn: '90m' });
    res.json({ token, user: { id: userId, username, roomId } });
  } catch (err) {
    console.error('Join error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
