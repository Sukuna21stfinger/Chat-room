const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    type: String
  },
  message: {
    type: String
  },
  room: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['text', 'gif', 'system'],
    default: 'text'
  },
  // for gifs we can store a url here
  attachment: {
    type: String
  },
  // reactions map emoji -> array of usernames
  reactions: {
    type: Map,
    of: [String],
    default: {}
  }
});

module.exports = mongoose.model('Message', messageSchema);