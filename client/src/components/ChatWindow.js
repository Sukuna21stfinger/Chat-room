import React, { useEffect, useRef } from 'react';
import Message from './Message';
import MessageInput from './MessageInput';

const ChatWindow = ({ messages, currentRoom, onSendMessage, currentUser, typingUsers }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--color-background)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 38,
          height: 38,
          background: 'var(--gradient-primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0
        }}>
          {currentRoom === 'general' ? '🏠' : '💬'}
        </div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-text)', fontSize: 16, fontWeight: 700 }}>
            #{currentRoom}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-textMuted)', fontSize: 12 }}>
            🔒 Encrypted · {messages.length} messages
          </p>
        </div>
      </div>
      
      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: 'var(--spacing-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
        background: 'var(--color-background)'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--color-textMuted)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: 'var(--spacing-4)',
              opacity: 0.5
            }}>
              💬
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--color-textSecondary)'
            }}>
              Welcome to #{currentRoom}
            </h3>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              maxWidth: '300px',
              lineHeight: '1.5'
            }}>
              This is the beginning of your secure conversation. Your messages are encrypted locally.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Message 
              key={`${message.timestamp}-${index}`}
              message={message} 
              currentUser={currentUser?.username}
            />
          ))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="animate-fade-in" style={{
            padding: 'var(--spacing-3) var(--spacing-4)',
            color: 'var(--color-textMuted)',
            fontSize: 'var(--font-size-sm)',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            width: 'fit-content',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-1)'
            }}>
              <div className="animate-bounce" style={{
                width: '4px',
                height: '4px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                animationDelay: '0ms'
              }}></div>
              <div className="animate-bounce" style={{
                width: '4px',
                height: '4px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                animationDelay: '150ms'
              }}></div>
              <div className="animate-bounce" style={{
                width: '4px',
                height: '4px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                animationDelay: '300ms'
              }}></div>
            </div>
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} currentRoom={currentRoom} />
    </div>
  );
};

export default ChatWindow;