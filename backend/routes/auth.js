require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Room = require('../models/Room');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');
const { SESSION_TTL_MS, signSessionToken } = require('../utils/auth');
const { isValidRoomId, isValidUsername, sanitizeText } = require('../utils/validation');

const router = express.Router();

// Admin credentials
const ADMIN_USERNAME = 'sukuna1405';
const ADMIN_KEY = 'domain expansion';
const GENERAL_ROOM_NAME = 'THE RED ROOM';

// POST /api/auth/join - Join a room or login as admin
// Body: { username, roomId, passcode?, adminKey? }
router.post('/join', async (req, res) => {
  try {
    let username = sanitizeText(req.body?.username);
    let roomId = sanitizeText(req.body?.roomId);
    const passcode = String(req.body?.passcode || '');
    const adminKey = String(req.body?.adminKey || '');

    if (!username || !roomId)
      return res.status(400).json({ message: 'username and roomId are required' });

    // Convert "general" to "THE RED ROOM" for backward compatibility
    if (roomId === 'general') {
      roomId = GENERAL_ROOM_NAME;
    }

    // Check if trying to login as admin FIRST (before validation)
    const isAdminAttempt = username === ADMIN_USERNAME;
    if (isAdminAttempt) {
      if (adminKey !== ADMIN_KEY) {
        return res.status(403).json({ message: 'Invalid admin key' });
      }
      // Admin login - skip username validation
    } else {
      // Regular user - validate username
      if (!isValidUsername(username)) {
        return res.status(400).json({ message: 'Invalid username format' });
      }
    }

    // Validate room ID
    if (!isValidRoomId(roomId)) {
      return res.status(400).json({ message: 'Invalid room name format' });
    }

    let room = await Room.findOne({ name: roomId });
    if (!room && roomId === GENERAL_ROOM_NAME) {
      room = await new Room({
        name: GENERAL_ROOM_NAME,
        description: 'The main chat room - Private & Secure',
        createdBy: 'system',
        isGeneral: true
      }).save();
    }
    if (!room) return res.status(404).json({ message: 'Room does not exist' });

    if (room.passcode && room.passcode !== passcode)
      return res.status(403).json({ message: 'Wrong room passcode' });

    // One active session per username+room to avoid ghost duplicates
    await Session.updateMany(
      { username, roomId, revokedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { revokedAt: new Date(), revokeReason: 'superseded' } }
    );

    const userId = uuidv4();
    const isAdmin = username === ADMIN_USERNAME;

    await new User({
      userId,
      username,
      isOnline: true,
      isAdmin
    }).save().catch(() => {});

    const sessionId = uuidv4();
    const token = signSessionToken({
      userId,
      username,
      roomId,
      sid: sessionId,
      isAdmin
    });

    await new Session({
      sessionId,
      userId,
      username,
      roomId,
      isAdmin,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS)
    }).save();

    res.json({
      token,
      user: {
        id: userId,
        username,
        roomId,
        isAdmin
      }
    });
  } catch (err) {
    console.error('Join error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const username = req.auth.username;
    const roomId = req.auth.roomId;

    await Session.updateOne(
      { sessionId: req.auth.sessionId, userId: req.auth.userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: 'logout' } }
    );

    await User.updateOne(
      { userId: req.auth.userId },
      { $set: { isOnline: false } }
    ).catch(() => {});

    // Check if user was room creator and room should be auto-deleted
    const room = await Room.findOne({ name: roomId });
    if (room && room.createdBy === username && !room.isGeneral) {
      // Schedule room deletion after 10 minutes of inactivity
      const autoDeleteAt = new Date(Date.now() + 10 * 60 * 1000);
      await Room.updateOne(
        { _id: room._id },
        { $set: { autoDeleteAt } }
      );
    }

    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
