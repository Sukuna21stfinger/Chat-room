/**
 * Seed script — run once to create the default "general" room.
 * Usage: node database/seed/seed.js
 */
require('dotenv').config({ path: '../../backend/.env' });
const mongoose = require('mongoose');
const Room = require('../models/Room');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const exists = await Room.findOne({ name: 'general' });
  if (!exists) {
    await new Room({ name: 'general', description: 'Default room', createdBy: 'system' }).save();
    console.log('Created default "general" room');
  } else {
    console.log('"general" room already exists — skipping');
  }

  await mongoose.disconnect();
  console.log('Done');
};

seed().catch(err => { console.error(err); process.exit(1); });
