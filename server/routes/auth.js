require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Guest login - create a temporary user and return token
router.post('/guest', async (req, res) => {
  try {
    // generate unique guest username
    let username = `guest_${Math.floor(Math.random() * 1000000)}`;
    // ensure uniqueness by checking existing users
    let existing = await User.findOne({ username });
    while (existing) {
      username = `guest_${Math.floor(Math.random() * 1000000)}`;
      existing = await User.findOne({ username });
    }
    // create a dummy email so schema validation passes
    const email = `${username}@example.com`;
    const rawPassword = Math.random().toString(36).slice(-8); // random password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;