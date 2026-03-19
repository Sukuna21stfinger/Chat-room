import { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import OnlineUsers from '../components/OnlineUsers';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { roomAPI } from '../services/api';
import privacyAuth from '../services/privacyAuth';
import { applyTheme, getStoredTheme } from '../styles/theme';

const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
};

const ChatPage = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());
  // Mobile drawer state: 'chat' | 'rooms' | 'users'
  const [mobileTab, setMobileTab] = useState('chat');
  const isMobile = useIsMobile();
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

  const handleRoomSelect = (r) => {
    setCurrentRoom(r);
    setTypingUsers([]);
    if (isMobile) setMobileTab('chat');
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!currentUser) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-background)' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--color-background)', overflow: 'hidden' }}>
        {/* Mobile panels */}
        <div style={{ flex: 1, overflow: 'hidden', display: mobileTab === 'rooms' ? 'flex' : 'none' }}>
          <Sidebar rooms={rooms} currentRoom={currentRoom} onRoomSelect={handleRoomSelect}
            currentUser={currentUser} unreadCounts={unreadCounts} onThemeToggle={toggleTheme}
            currentTheme={currentTheme} onLogout={handleLogout} isMobile />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: mobileTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
          <ChatWindow messages={messages} currentRoom={currentRoom} onSendMessage={sendMessage}
            currentUser={currentUser} typingUsers={typingUsers} isMobile />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: mobileTab === 'users' ? 'flex' : 'none' }}>
          <OnlineUsers users={onlineUsers} isMobile />
        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          {[
            { id: 'rooms', icon: '☰', label: 'Rooms', badge: totalUnread },
            { id: 'chat',  icon: '💬', label: 'Chat',  badge: 0 },
            { id: 'users', icon: '👥', label: 'Online', badge: onlineUsers.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMobileTab(tab.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '6px 0', position: 'relative',
                color: mobileTab === tab.id ? 'var(--color-primary)' : 'var(--color-textMuted)',
                borderTop: mobileTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'transparent', transition: 'color 0.15s' }}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{ position: 'absolute', top: 4, right: '50%', transform: 'translateX(10px)', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 999, padding: '0 5px', fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-family)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <Sidebar rooms={rooms} currentRoom={currentRoom} onRoomSelect={handleRoomSelect}
        currentUser={currentUser} unreadCounts={unreadCounts} onThemeToggle={toggleTheme}
        currentTheme={currentTheme} onLogout={handleLogout} />
      <ChatWindow messages={messages} currentRoom={currentRoom} onSendMessage={sendMessage}
        currentUser={currentUser} typingUsers={typingUsers} />
      <OnlineUsers users={onlineUsers} />
    </div>
  );
};

export default ChatPage;
