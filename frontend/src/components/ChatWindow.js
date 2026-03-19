import React, { useEffect, useRef } from 'react';
import Message from './Message';
import MessageInput from './MessageInput';

const ChatWindow = ({ messages, currentRoom, onSendMessage, currentUser, typingUsers, isMobile }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)', minHeight: 0, overflow: 'hidden' }}>

      {/* Header — desktop only */}
      {!isMobile && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {currentRoom === 'general' ? '🏠' : '💬'}
          </div>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text)', fontSize: 16, fontWeight: 700 }}>#{currentRoom}</h2>
            <p style={{ margin: 0, color: 'var(--color-textMuted)', fontSize: 12 }}>🔒 Encrypted · {messages.length} messages</p>
          </div>
        </div>
      )}

      {/* Messages — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '12px 10px' : '20px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--color-background)', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-textMuted)', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12, opacity: 0.4 }}>💬</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--color-textSecondary)' }}>Welcome to #{currentRoom}</h3>
            <p style={{ fontSize: 13, maxWidth: 260, lineHeight: 1.5 }}>Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => <Message key={`${msg.timestamp}-${i}`} message={msg} currentUser={currentUser?.username} />)
        )}

        {typingUsers.length > 0 && (
          <div className="animate-fade-in" style={{ padding: '6px 12px', color: 'var(--color-textMuted)', fontSize: 12, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--color-surface)', borderRadius: 16, width: 'fit-content', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 150, 300].map(d => (
                <div key={d} className="animate-bounce" style={{ width: 4, height: 4, backgroundColor: 'var(--color-primary)', borderRadius: '50%', animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — always at bottom */}
      <div style={{ flexShrink: 0 }}>
        <MessageInput onSendMessage={onSendMessage} currentRoom={currentRoom} />
      </div>
    </div>
  );
};

export default ChatWindow;
