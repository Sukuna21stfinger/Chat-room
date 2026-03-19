import { useState } from 'react';
import { roomAPI } from '../services/api';

const Sidebar = ({ rooms, currentRoom, onRoomSelect, currentUser, unreadCounts, onThemeToggle, currentTheme, onLogout, isMobile }) => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await roomAPI.createRoom({ name: newRoomName, createdBy: currentUser.username });
      setNewRoomName(''); setShowCreateRoom(false);
      window.location.reload();
    } catch { console.error('Failed to create room'); }
  };

  const avatar = (u) => `https://api.dicebear.com/7.x/initials/svg?seed=${u}&backgroundColor=667eea`;
  const themeIcon = { light: '☀️', dark: '🌙', midnight: '🌌' }[currentTheme] || '🎨';

  const roomItem = (name, icon, isActive, onClick, onDelete) => (
    <div onClick={onClick}
      style={{ padding: '11px 12px', marginBottom: 4, cursor: 'pointer',
        backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
        color: isActive ? 'white' : 'var(--color-text)',
        borderRadius: 10, transition: 'all 0.15s',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        minHeight: 44 }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surfaceHover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {unreadCounts?.[name] > 0 && (
          <span style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-error)', color: 'white', borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
            {unreadCounts[name]}
          </span>
        )}
        {onDelete && (
          <button onClick={onDelete} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, opacity: 0.6, fontSize: 14, minWidth: 32, minHeight: 32 }}
            onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.6}>🗑️</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      width: isMobile ? '100%' : 260,
      backgroundColor: 'var(--color-surface)',
      borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      height: isMobile ? '100%' : '100vh',
      paddingBottom: isMobile ? 'var(--bottom-nav-height)' : 0
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>💬 ChatApp</h2>
          <button onClick={onThemeToggle} className="btn-ghost" style={{ padding: 6, fontSize: 18, minWidth: 40, minHeight: 40 }} title="Toggle theme">{themeIcon}</button>
        </div>
        <button onClick={() => setShowCreateRoom(!showCreateRoom)} className="btn btn-primary" style={{ width: '100%', fontSize: 13 }}>
          ➕ New Room
        </button>
      </div>

      {showCreateRoom && (
        <div className="animate-slide-up" style={{ padding: 12, backgroundColor: 'var(--color-surfaceHover)', borderBottom: '1px solid var(--color-border)' }}>
          <form onSubmit={handleCreateRoom}>
            <input type="text" placeholder="Room name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} required className="input" style={{ marginBottom: 8, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}>Create</button>
              <button type="button" onClick={() => setShowCreateRoom(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 6px 8px' }}>Rooms</div>
        {roomItem('general', '🏠', currentRoom === 'general', () => onRoomSelect('general'), null)}
        {rooms.map(room => roomItem(
          room.name, '💬', currentRoom === room.name,
          () => onRoomSelect(room.name),
          async (e) => {
            e.stopPropagation();
            if (!window.confirm(`Delete room '${room.name}'?`)) return;
            try { await roomAPI.deleteRoom(room._id || room.name); window.location.reload(); }
            catch (err) { alert(err?.response?.data?.message || 'Failed to delete room'); }
          }
        ))}
      </div>

      {/* User profile */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <img src={avatar(currentUser?.username)} alt={currentUser?.username} style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--color-primary)', flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--color-online)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, backgroundColor: 'var(--color-online)', borderRadius: '50%', display: 'inline-block' }} />
              Online
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary" style={{ width: '100%', fontSize: 13, color: 'var(--color-error)' }}>
          🚪 Leave
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
