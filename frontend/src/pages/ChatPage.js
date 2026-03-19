import { useEffect, useRef, useState } from 'react';
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

// Slide-in drawer for mobile
const Drawer = ({ open, onClose, children }) => (
  <>
    {open && (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
    )}
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '80vw', maxWidth: 320,
      background: 'var(--color-surface)', zIndex: 201, boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      transform: open ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto'
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--color-textMuted)', zIndex: 1 }}>✕</button>
      {children}
    </div>
  </>
);

const ChatPage = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('rooms'); // 'rooms' | 'users'
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
      message: payload.type === 'gif' ? '' : (payload.message || ''),
      room: currentRoom,
      type: payload.type || 'text',
      attachment: payload.type === 'gif' ? payload.attachment : undefined
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
    setDrawerOpen(false);
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

        {/* Mobile top header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {currentRoom === 'general' ? '🏠' : '💬'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>#{currentRoom}</div>
              <div style={{ fontSize: 11, color: 'var(--color-textMuted)' }}>{onlineUsers.length} online</div>
            </div>
          </div>

          {/* Hamburger */}
          <button onClick={() => setDrawerOpen(v => !v)} style={{ position: 'relative', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, width: 38, height: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}>
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--color-text)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--color-text)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--color-text)', borderRadius: 2 }} />
            {totalUnread > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--color-error)', borderRadius: '50%' }} />
            )}
          </button>
        </div>

        {/* Chat fills remaining space, scrollable */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ChatWindow
            messages={messages}
            currentRoom={currentRoom}
            onSendMessage={sendMessage}
            currentUser={currentUser}
            typingUsers={typingUsers}
            isMobile
          />
        </div>

        {/* Slide-in drawer */}
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {/* Drawer tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginTop: 0 }}>
            {['rooms', 'users'].map(tab => (
              <button key={tab} onClick={() => setDrawerTab(tab)} style={{ flex: 1, padding: '14px 0', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', borderBottom: drawerTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', color: drawerTab === tab ? 'var(--color-primary)' : 'var(--color-textMuted)', cursor: 'pointer', textTransform: 'capitalize' }}>
                {tab === 'rooms' ? `Rooms${totalUnread > 0 ? ` (${totalUnread})` : ''}` : `Online (${onlineUsers.length})`}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {drawerTab === 'rooms' && (
              <Sidebar rooms={rooms} currentRoom={currentRoom} onRoomSelect={handleRoomSelect}
                currentUser={currentUser} unreadCounts={unreadCounts} onThemeToggle={toggleTheme}
                currentTheme={currentTheme} onLogout={handleLogout} isMobile />
            )}
            {drawerTab === 'users' && <OnlineUsers users={onlineUsers} isMobile />}
          </div>
        </Drawer>
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
