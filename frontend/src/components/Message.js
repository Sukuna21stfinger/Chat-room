import { format } from 'date-fns';
import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const Message = ({ message, currentUser }) => {
  const isOwn = message.user === currentUser;
  const socket = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);

  const formatTime = (ts) => { try { return format(new Date(ts), 'h:mm a'); } catch { return ''; } };
  const avatar = (u) => `https://api.dicebear.com/7.x/initials/svg?seed=${u}&backgroundColor=667eea`;

  const bubble = isOwn
    ? { background: 'var(--gradient-message)', color: 'white', borderRadius: '12px 12px 4px 12px', marginLeft: 'auto' }
    : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderRadius: '12px 12px 12px 4px', marginRight: 'auto', border: '1px solid var(--color-border)' };

  if (message.type === 'system') {
    return (
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-textMuted)', padding: '4px 0' }}>
        {message.message}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 12, gap: 10 }}>
      {!isOwn && <img src={avatar(message.user)} alt={message.user} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-border)', flexShrink: 0 }} />}

      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {!isOwn && <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginBottom: 4 }}>{message.user}</div>}

        <div style={{ ...bubble, padding: '10px 14px', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
          {isOwn && (
            <button onClick={() => setMenuOpen(v => !v)} style={{ position: 'absolute', top: 4, right: 6, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: 16 }}>⋯</button>
          )}
          <div style={{ fontSize: 14, lineHeight: 1.5, paddingRight: isOwn ? 16 : 0 }}>
            {message.type === 'gif' && message.attachment
              ? <img src={message.attachment} alt="gif" style={{ maxWidth: 280, borderRadius: 8 }} />
              : message.message}
          </div>
          <div style={{ fontSize: 11, color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--color-textMuted)', marginTop: 6 }}>
            {formatTime(message.timestamp)}
          </div>

          {isOwn && menuOpen && (
            <div style={{ position: 'absolute', top: 32, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 6, zIndex: 40, minWidth: 130, boxShadow: 'var(--shadow-md)' }}>
              <button onClick={() => { socket.emit('delete_message', { messageId: message.id || message._id || message.timestamp, room: message.room }); setMenuOpen(false); }}
                style={{ display: 'block', width: '100%', padding: '6px 10px', textAlign: 'left', background: 'transparent', border: 0, fontSize: 13, borderRadius: 6 }}
                onMouseEnter={e => e.target.style.background = 'var(--color-surfaceHover)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >🗑️ Delete</button>
              <button onClick={() => { navigator.clipboard?.writeText(message.message || ''); setMenuOpen(false); }}
                style={{ display: 'block', width: '100%', padding: '6px 10px', textAlign: 'left', background: 'transparent', border: 0, fontSize: 13, borderRadius: 6 }}
                onMouseEnter={e => e.target.style.background = 'var(--color-surfaceHover)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >📋 Copy</button>
            </div>
          )}
        </div>
      </div>

      {isOwn && <img src={avatar(message.user)} alt={message.user} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-primary)', flexShrink: 0 }} />}
    </div>
  );
};

export default Message;
