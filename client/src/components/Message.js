import { format } from 'date-fns';
import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const Message = ({ message, currentUser }) => {
  const isOwnMessage = message.user === currentUser;
  const socket = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);

  const formatTime = (timestamp) => format(new Date(timestamp), 'h:mm a');

  const getAvatarUrl = (username) => `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=667eea`;

  const bubbleStyle = isOwnMessage
    ? { background: 'var(--gradient-message)', color: 'white', borderRadius: '12px 12px 6px 12px', marginLeft: 'auto' }
    : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderRadius: '12px 12px 12px 6px', marginRight: 'auto', border: '1px solid var(--color-border)' };

  const handleDelete = () => {
    const messageId = message.id || message._id || message.timestamp;
    socket.emit('delete_message', { messageId, room: message.room });
    setMenuOpen(false);
  };

  const handleShare = () => {
    const shareText = `${message.user}: ${message.message || message.type}`;
    if (navigator.share) {
      navigator.share({ title: 'Chat message', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).catch(() => {});
      alert('Message copied to clipboard');
    }
    setMenuOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', marginBottom: 16, gap: 12 }}>
      {!isOwnMessage && (
        <img src={getAvatarUrl(message.user)} alt={message.user} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-border)' }} />
      )}

      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
        {!isOwnMessage && <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginBottom: 4 }}>{message.user}</div>}

        <div style={{ ...bubbleStyle, padding: '12px 16px', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
          {isOwnMessage && (
            <button aria-label="menu" onClick={() => setMenuOpen(v => !v)} style={{ position: 'absolute', top: 6, right: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}>⋯</button>
          )}

          <div style={{ fontSize: 14, lineHeight: 1.4 }}>
            {message.type === 'gif' && message.attachment ? (
              <img src={message.attachment} alt="gif" style={{ maxWidth: 360, borderRadius: 8 }} />
            ) : (
              message.message
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginTop: 8 }}>
            {formatTime(message.timestamp)} {isOwnMessage && <span style={{ opacity: 0.7 }}>• Encrypted</span>}
          </div>

          {isOwnMessage && menuOpen && (
            <div style={{ position: 'absolute', top: 36, right: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, zIndex: 40, minWidth: 140 }}>
              <button onClick={handleDelete} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 0 }}>🗑️ Delete</button>
              <button onClick={handleShare} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 0 }}>🔗 Share</button>
            </div>
          )}
        </div>
      </div>

      {isOwnMessage && (
        <img src={getAvatarUrl(message.user)} alt={message.user} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-primary)' }} />
      )}
    </div>
  );
};

export default Message;