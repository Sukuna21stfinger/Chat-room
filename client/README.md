# ChatApp Desktop Client

React-based desktop application for real-time messaging.

## 🖥️ For End Users

1. **Get the app:** Receive this folder from the developer
2. **Run:** Double-click `ChatApp-Desktop.bat`
3. **First time:** App will install dependencies automatically
4. **Register:** Create your account
5. **Chat:** Join rooms and start messaging!

## 📋 Requirements

- Windows computer
- Internet connection
- Node.js (will prompt to install if missing)

## 🎯 Features

- Real-time messaging
- Multiple chat rooms
- User authentication
- Professional chat interface
- Typing indicators
- Online user tracking
- Auto-generated avatars
- Dark mode toggle

## 🔧 For Developers

### Development
```bash
npm install
npm start
```

### Build for Production
```bash
npm run build
```

### Desktop App
```bash
npm run electron-dev
```

## 📁 Key Files

- `ChatApp-Desktop.bat` - Main executable for users
- `src/` - React source code
- `public/electron.js` - Electron main process
- `.env.production` - Production server URLs

## 🌐 Server Configuration

Update `.env.production` with your deployed server URL:
```env
REACT_APP_API_URL=https://your-server.vercel.app/api
REACT_APP_SERVER_URL=https://your-server.vercel.app
```

---

**Professional desktop chat application built with React and Electron.**