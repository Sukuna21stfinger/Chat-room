require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { startAutoDeleteChecker } = require('./utils/roomManager');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',').map(s => s.trim());

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.get('/', (req, res) => res.json({ status: 'OK', message: 'ChatApp backend running' }));
app.get('/health', (req, res) => res.json({
  status: 'OK',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// Socket.io
require('./socket/socketHandler')(io);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Start server
const start = async () => {
  try {
    await connectDB();

    // Start auto-delete checker for rooms
    startAutoDeleteChecker();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Frontend: ${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}`);
      console.log(`✓ Admin user: sukuna1405 (key: domain expansion)`);
    });
  } catch (err) {
    console.error('✗ Startup failed:', err.message);
    process.exit(1);
  }
};

start();
