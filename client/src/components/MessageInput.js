import React, { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const MessageInput = ({ onSendMessage, currentRoom }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const socket = useSocket();
  const typingTimeoutRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    if (socket && currentUser && e.target.value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { 
          room: currentRoom, 
          username: currentUser.username 
        });
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop_typing', { 
          room: currentRoom, 
          username: currentUser.username 
        });
      }, 1000);
    } else if (isTyping) {
      setIsTyping(false);
      socket.emit('stop_typing', { 
        room: currentRoom, 
        username: currentUser.username 
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      
      // Stop typing when message is sent
      if (isTyping) {
        setIsTyping(false);
        socket.emit('stop_typing', { 
          room: currentRoom, 
          username: currentUser.username 
        });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ 
      padding: 'var(--spacing-5)',
      backgroundColor: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      boxShadow: '0 -4px 12px var(--color-shadow)'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        gap: 'var(--spacing-3)', 
        alignItems: 'flex-end',
        maxWidth: '100%'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your secure message..."
            rows={1}
            className="input"
            style={{
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
              paddingRight: 'var(--spacing-12)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.5'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          
          {/* Character count and encryption indicator */}
          <div style={{
            position: 'absolute',
            bottom: 'var(--spacing-2)',
            right: 'var(--spacing-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-textMuted)'
          }}>
            <span>🔒</span>
            <span>{message.length}/1000</span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!message.trim()}
          className="btn btn-primary"
          style={{
            padding: 'var(--spacing-3) var(--spacing-5)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            minWidth: '80px',
            height: '44px',
            opacity: message.trim() ? 1 : 0.5,
            cursor: message.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
            📤 Send
          </span>
        </button>
      </form>
      
      {/* Privacy notice */}
      <div style={{
        marginTop: 'var(--spacing-3)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-textMuted)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-2)'
      }}>
        <span>🛡️</span>
        <span>Your messages are encrypted locally and stored securely</span>
      </div>
    </div>
  );
};

export default MessageInput;