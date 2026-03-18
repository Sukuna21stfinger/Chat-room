require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

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

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => res.json({ status: 'OK', message: 'ChatApp backend running' }));
app.get('/health', (req, res) => res.json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

require('./socket/socketHandler')(io);

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('MongoDB connected');
};

const start = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
};

start();
