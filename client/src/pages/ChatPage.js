import { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import OnlineUsers from '../components/OnlineUsers';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { roomAPI } from '../services/api';
import privacyAuth from '../services/privacyAuth';
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
    if (!user) { window.location.href = '/'; return; }
    setCurrentUser(user);
    if (user.roomId) setCurrentRoom(user.roomId);
    roomAPI.getRooms().then(r => setRooms(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const onMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.room && msg.room !== currentRoom)
        setUnreadCounts(prev => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
    };
    const onOnlineUsers = (users) => setOnlineUsers(users);
    const onTyping = (d) => { if (d.username !== currentUser.username) setTypingUsers(p => p.includes(d.username) ? p : [...p, d.username]); };
    const onStopTyping = (d) => setTypingUsers(p => p.filter(u => u !== d.username));
    const onDeleted = ({ messageId }) => setMessages(p => p.filter(m => (m.id || m._id) !== messageId));
    const onReacted = ({ messageId, reactions }) => setMessages(p => p.map(m => (m.id || m._id) === messageId ? { ...m, reactions } : m));

    socket.off('receive_message').on('receive_message', onMessage);
    socket.off('online_users').on('online_users', onOnlineUsers);
    socket.off('user_typing').on('user_typing', onTyping);
    socket.off('user_stop_typing').on('user_stop_typing', onStopTyping);
    socket.off('message_deleted').on('message_deleted', onDeleted);
    socket.off('message_reacted').on('message_reacted', onReacted);

    socket.emit('join_room', { room: currentRoom, username: currentUser.username });
    roomAPI.getMessages(currentRoom).then(r => setMessages(r.data)).catch(() => {});
    setUnreadCounts(prev => ({ ...prev, [currentRoom]: 0 }));

    return () => {
      socket.off('receive_message', onMessage);
      socket.off('online_users', onOnlineUsers);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      socket.off('message_deleted', onDeleted);
      socket.off('message_reacted', onReacted);
    };
  }, [socket, currentRoom, currentUser]);

  const sendMessage = (payload) => {
    if (!socket || !currentUser) return;
    socket.emit('send_message', {
      user: currentUser.username,
      message: payload.message || '',
      room: currentRoom,
      type: payload.type || 'text',
      attachment: payload.attachment
    });
  };

  const toggleTheme = () => {
    const list = ['light', 'dark', 'midnight'];
    const next = list[(list.indexOf(currentTheme) + 1) % list.length];
    setCurrentTheme(next); applyTheme(next);
  };

  const handleLogout = () => { privacyAuth.clearSession(); window.location.href = '/'; };

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
