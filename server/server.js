require('dotenv').config();
console.log('server.js starting - PID', process.pid);
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: (origin, callback) => callback(null, true), methods: ['GET', 'POST'] }
});

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => res.json({ message: 'Chat App Server is running!', status: 'OK' }));

// Lazy MongoDB connection
let dbConnected = false;
const connectDB = async () => {
  if (dbConnected || mongoose.connection.readyState === 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  dbConnected = true;
  console.log('Connected to MongoDB');
};

// Ensure DB is connected before any /api route
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(503).json({ message: 'Database unavailable. Please try again.' });
  }
});

// Mount routes AFTER the DB middleware
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
require('./socket/socketHandler')(io);

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'production') {
  startServer();
}

module.exports = app;