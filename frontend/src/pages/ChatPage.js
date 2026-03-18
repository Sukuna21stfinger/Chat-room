import { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import OnlineUsers from '../components/OnlineUsers';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { roomAPI } from '../services/api';
import privacyAuth from '../services/privacyAuth';
import secureStorage from '../services/secureStorage';
import { applyTheme, getStoredTheme } from '../styles/theme';

const ChatPage = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());
  const socket = useSocket();

  useEffect(() => { applyTheme(currentTheme); }, [currentTheme]);

  useEffect(() => {
    const user = privacyAuth.getCurrentUser();
    if (!user) { window.location.href = '/login'; return; }
    setCurrentUser(user);
    roomAPI.getRooms().then(r => setRooms(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket || !currentUser) return;
    socket.emit('join_room', { room: currentRoom, username: currentUser.username });
    loadMessages(currentRoom);
    setUnreadCounts(prev => ({ ...prev, [currentRoom]: 0 }));

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.user === currentUser.username) secureStorage.saveSentMessage(msg, currentRoom);
      if (msg.room && msg.room !== currentRoom) {
        setUnreadCounts(prev => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
      }
    });
    socket.on('online_users', setOnlineUsers);
    socket.on('user_typing', (d) => { if (d.username !== currentUser.username) setTypingUsers(p => p.includes(d.username) ? p : [...p, d.username]); });
    socket.on('user_stop_typing', (d) => setTypingUsers(p => p.filter(u => u !== d.username)));
    socket.on('message_deleted', ({ messageId }) => setMessages(p => p.filter(m => (m.id || m._id || m.timestamp) !== messageId)));
    socket.on('message_reacted', ({ messageId, reactions }) => setMessages(p => p.map(m => (m.id || m._id) === messageId ? { ...m, reactions } : m)));

    return () => {
      ['receive_message','online_users','user_typing','user_stop_typing','message_deleted','message_reacted'].forEach(e => socket.off(e));
    };
  }, [socket, currentRoom, currentUser]);

  const loadMessages = async (roomId) => {
    try {
      const { data: serverMsgs } = await roomAPI.getMessages(roomId);
      const localMsgs = secureStorage.getSentMessages(roomId);
      const all = [...serverMsgs];
      localMsgs.forEach(lm => {
        const exists = serverMsgs.find(sm => sm.user === lm.user && sm.message === lm.message && Math.abs(new Date(sm.timestamp) - new Date(lm.timestamp)) < 5000);
        if (!exists) all.push(lm);
      });
      all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(all);
    } catch {
      setMessages(secureStorage.getSentMessages(roomId));
    }
  };

  const sendMessage = (payload) => {
    if (!socket || !currentUser) return;
    const msg = {
      user: currentUser.username,
      message: payload.message || '',
      room: currentRoom,
      timestamp: new Date().toISOString(),
      type: payload.type || 'text',
      attachment: payload.attachment
    };
    secureStorage.saveSentMessage(msg, currentRoom);
    socket.emit('send_message', msg);
  };

  const toggleTheme = () => {
    const list = ['light', 'dark', 'midnight'];
    const next = list[(list.indexOf(currentTheme) + 1) % list.length];
    setCurrentTheme(next);
    applyTheme(next);
  };

  const handleLogout = () => {
    privacyAuth.clearSession();
    if (window.confirm('Clear locally stored messages?')) secureStorage.clearSentMessages();
    window.location.href = '/login';
  };

  if (!currentUser) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-background)' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-family)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <Sidebar rooms={rooms} currentRoom={currentRoom} onRoomSelect={(r) => { setCurrentRoom(r); setTypingUsers([]); }} currentUser={currentUser} unreadCounts={unreadCounts} onThemeToggle={toggleTheme} currentTheme={currentTheme} onLogout={handleLogout} />
      <ChatWindow messages={messages} currentRoom={currentRoom} onSendMessage={sendMessage} currentUser={currentUser} typingUsers={typingUsers} />
      <OnlineUsers users={onlineUsers} />
    </div>
  );
};

export default ChatPage;
