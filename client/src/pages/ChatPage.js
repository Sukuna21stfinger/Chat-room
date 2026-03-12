import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { roomAPI } from '../services/api';
import secureStorage from '../services/secureStorage';
import privacyAuth from '../services/privacyAuth';
import { applyTheme, getStoredTheme } from '../styles/theme';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import OnlineUsers from '../components/OnlineUsers';

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

  useEffect(() => {
    // Apply theme
    applyTheme(currentTheme);
    
    // Get current user from secure session
    const user = privacyAuth.getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setCurrentUser(user);
    
    loadRooms();
  }, [currentTheme]);

  useEffect(() => {
    if (socket && currentUser) {
      socket.emit('join_room', { room: currentRoom, username: currentUser.username });
      loadMessages(currentRoom);
      
      // Clear unread count for current room
      setUnreadCounts(prev => ({ ...prev, [currentRoom]: 0 }));

      socket.on('receive_message', (message) => {
        setMessages(prev => [...prev, message]);
        
        // Save sent messages locally (encrypted)
        if (message.user === currentUser.username) {
          secureStorage.saveSentMessage(message, currentRoom);
        }
        
        // Increment unread count if message is not from current room
        if (message.room !== currentRoom) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.room]: (prev[message.room] || 0) + 1
          }));
        }
      });

      socket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      socket.on('user_typing', (data) => {
        if (data.username !== currentUser.username) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        }
      });

      socket.on('user_stop_typing', (data) => {
        setTypingUsers(prev => prev.filter(user => user !== data.username));
      });

      socket.on('user_joined', (message) => {
        console.log(message);
      });

      socket.on('user_left', (message) => {
        console.log(message);
      });

      return () => {
        socket.off('receive_message');
        socket.off('online_users');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('user_joined');
        socket.off('user_left');
      };
    }
  }, [socket, currentRoom, currentUser]);

  const loadRooms = async () => {
    try {
      const response = await roomAPI.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms');
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await roomAPI.getMessages(roomId);
      const serverMessages = response.data;
      
      // Merge with locally stored sent messages
      const localSentMessages = secureStorage.getSentMessages(roomId);
      
      // Combine and sort messages
      const allMessages = [...serverMessages];
      
      // Add local messages that might not be on server yet
      localSentMessages.forEach(localMsg => {
        const exists = serverMessages.find(serverMsg => 
          serverMsg.user === localMsg.user && 
          serverMsg.message === localMsg.message &&
          Math.abs(new Date(serverMsg.timestamp) - new Date(localMsg.timestamp)) < 5000
        );
        if (!exists) {
          allMessages.push(localMsg);
        }
      });
      
      // Sort by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Failed to load messages');
      // Fallback to local messages only
      const localMessages = secureStorage.getSentMessages(roomId);
      setMessages(localMessages);
    }
  };

  const sendMessage = (message) => {
    if (socket && message.trim() && currentUser) {
      const messageData = {
        user: currentUser.username,
        message,
        room: currentRoom,
        timestamp: new Date().toISOString()
      };
      
      // Save locally first (encrypted)
      secureStorage.saveSentMessage(messageData, currentRoom);
      
      // Send to server
      socket.emit('send_message', messageData);
    }
  };

  const switchRoom = (roomId) => {
    setCurrentRoom(roomId);
    setTypingUsers([]);
  };

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'midnight'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = () => {
    // Clear secure session
    privacyAuth.clearSession();
    
    // Optionally clear local messages (ask user)
    const clearLocal = window.confirm('Do you want to clear your locally stored messages?');
    if (clearLocal) {
      secureStorage.clearSentMessages();
    }
    
    window.location.href = '/login';
  };

  if (!currentUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-background)'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      fontFamily: 'var(--font-family)',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text)'
    }}>
      <Sidebar 
        rooms={rooms} 
        currentRoom={currentRoom} 
        onRoomSelect={switchRoom}
        currentUser={currentUser}
        unreadCounts={unreadCounts}
        onThemeToggle={toggleTheme}
        currentTheme={currentTheme}
        onLogout={handleLogout}
      />
      <ChatWindow 
        messages={messages}
        currentRoom={currentRoom}
        onSendMessage={sendMessage}
        currentUser={currentUser}
        typingUsers={typingUsers}
      />
      <OnlineUsers users={onlineUsers} />
    </div>
  );
};

export default ChatPage;