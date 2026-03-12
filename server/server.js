require('dotenv').config();
console.log('server.js starting - PID', process.pid);
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
// Allow configuring client origin(s) via environment variable (comma-separated)
const clientOriginEnv = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const clientOrigins = clientOriginEnv.split(',').map(s => s.trim());

const io = socketIo(server, {
  cors: {
    origin: clientOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: clientOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Chat App Server is running!', status: 'OK' });
});

// MongoDB connection (optionally skip DB for local quick testing with SKIP_DB=true)
const startServer = async () => {
  try {
    const skipDb = process.env.SKIP_DB === 'true';
    // In production, do not allow in-memory DB or skipping DB — require MONGODB_URI
    if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
      console.error('FATAL: NODE_ENV=production requires a valid MONGODB_URI.');
      process.exit(1);
    }
    if (!skipDb) {
      // Use MongoDB connection string from environment or fallback to local
      let mongoUri = process.env.MONGODB_URI;
      let memoryServer = null;
      if (!mongoUri) {
        // If no MONGODB_URI provided, start an in-memory MongoDB for demo/testing
        console.warn('No MONGODB_URI provided — starting in-memory MongoDB for demo/testing.');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        mongoUri = memoryServer.getUri();
      }

      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB');

      // Routes that require DB
      app.use('/api/auth', require('./routes/auth'));
      app.use('/api/rooms', require('./routes/rooms'));

      // Socket handling
      require('./socket/socketHandler')(io);
    } else {
      console.warn('SKIP_DB is set. Starting server without connecting to MongoDB. Some routes will be unavailable.');
      // still mount a minimal auth router that will return 503 for DB ops
      app.use('/api/auth', (req, res) => res.status(503).json({ message: 'DB disabled (SKIP_DB=true)' }));
    }

    const PORT = process.env.PORT || 5000;
    console.log('about to call server.listen on port', PORT);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();

// Export for Vercel
module.exports = app;