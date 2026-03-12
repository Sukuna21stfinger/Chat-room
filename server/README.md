# ChatApp Server

Node.js backend for the ChatApp real-time messaging platform.

## 🚀 Quick Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial server setup"
   git remote add origin https://github.com/yourusername/chat-app-server.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Import your GitHub repository
   - Add environment variables:
     - `MONGODB_URI`: MongoDB Atlas connection string
     - `JWT_SECRET`: Secure random string
     - `NODE_ENV`: production

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production
```

## 📡 API Endpoints

- `GET /` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/:id/messages` - Get room messages

## 🔌 Socket Events

- `connection` - User connects
- `join_room` - Join chat room
- `send_message` - Send message
- `typing` - Typing indicator
- `disconnect` - User disconnects

## 🛠️ Local Development

```bash
npm install
npm start
```

Server runs on http://localhost:5000

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- CORS protection
- Input validation

---

**Production-ready Node.js server with real-time capabilities.**