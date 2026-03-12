import React from 'react';
import { format } from 'date-fns';

const Message = ({ message, currentUser }) => {
  const isOwnMessage = message.user === currentUser;
  
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const getAvatarUrl = (username) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=667eea,764ba2,06b6d4,8b5cf6,10b981`;
  };

  const getMessageStyle = () => {
    if (isOwnMessage) {
      return {
        background: 'var(--gradient-message)',
        color: 'white',
        borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)',
        marginLeft: 'auto'
      };
    } else {
      return {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
        marginRight: 'auto',
        border: '1px solid var(--color-border)'
      };
    }
  };

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      marginBottom: 'var(--spacing-4)',
      alignItems: 'flex-end',
      gap: 'var(--spacing-2)',
      maxWidth: '100%'
    }}>
      {!isOwnMessage && (
        <img 
          src={getAvatarUrl(message.user)}
          alt={message.user}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            flexShrink: 0,
            border: '2px solid var(--color-border)'
          }}
        />
      )}
      
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}>
        {!isOwnMessage && (
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-textMuted)',
            marginBottom: 'var(--spacing-1)',
            marginLeft: 'var(--spacing-3)',
            fontWeight: '500'
          }}>
            {message.user}
          </div>
        )}
        
        <div style={{
          ...getMessageStyle(),
          padding: 'var(--spacing-3) var(--spacing-4)',
          wordWrap: 'break-word',
          position: 'relative',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition-normal)'
        }}>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            lineHeight: '1.5'
          }}>
            {message.message}
          </div>
          
          {/* Message status indicator for sent messages */}
          {isOwnMessage && (
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: 'var(--spacing-2)',
              fontSize: 'var(--font-size-xs)',
              opacity: 0.7
            }}>
              🔒
            </div>
          )}
        </div>
        
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-textMuted)',
          marginTop: 'var(--spacing-1)',
          marginLeft: isOwnMessage ? '0' : 'var(--spacing-3)',
          marginRight: isOwnMessage ? 'var(--spacing-3)' : '0',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-1)'
        }}>
          {formatTime(message.timestamp)}
          {isOwnMessage && (
            <span style={{ opacity: 0.6 }}>• Encrypted</span>
          )}
        </div>
      </div>
      
      {isOwnMessage && (
        <img 
          src={getAvatarUrl(message.user)}
          alt={message.user}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            flexShrink: 0,
            border: '2px solid var(--color-primary)',
            opacity: 0.9
          }}
        />
      )}
    </div>
  );
};

export default Message;