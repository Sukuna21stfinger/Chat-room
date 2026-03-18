import CryptoJS from 'crypto-js';

class SecureChatStorage {
  constructor() {
    this.secretKey = this.generateOrGetSecretKey();
    this.isElectron = this.checkElectronEnvironment();
    this.chatDir = null;
    this.initializeStorage();
  }

  // Check if running in Electron environment
  checkElectronEnvironment() {
    try {
      return window && window.require && typeof window.require === 'function';
    } catch (error) {
      return false;
    }
  }

  // Initialize storage directory
  initializeStorage() {
    if (this.isElectron) {
      try {
        const path = window.require('path');
        const fs = window.require('fs-extra');
        
        // Get current working directory and create secure-chats folder
        const cwd = process.cwd();
        this.chatDir = path.join(cwd, 'secure-chats');
        
        // Ensure directory exists
        fs.ensureDirSync(this.chatDir);
        console.log('🔒 Secure chat storage initialized at:', this.chatDir);
      } catch (error) {
        console.warn('⚠️ Electron file system not available, falling back to localStorage:', error.message);
        this.isElectron = false;
      }
    } else {
      console.log('📱 Running in browser mode, using localStorage');
    }
  }

  // Generate or retrieve user-specific encryption key
  generateOrGetSecretKey() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'anonymous';
    
    let secretKey = localStorage.getItem(`chatKey_${userId}`);
    if (!secretKey) {
      // Generate a new key based on user info and random data
      secretKey = CryptoJS.SHA256(userId + Date.now() + Math.random()).toString();
      localStorage.setItem(`chatKey_${userId}`, secretKey);
      console.log('🔑 New encryption key generated for user:', userId);
    }
    return secretKey;
  }

  // Get user's chat file path
  getUserChatFile(username) {
    if (!this.isElectron || !this.chatDir) return null;
    
    try {
      const path = window.require('path');
      const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
      return path.join(this.chatDir, `${sanitizedUsername}_chats.enc`);
    } catch (error) {
      console.error('Failed to get chat file path:', error);
      return null;
    }
  }

  // Encrypt message data
  encryptMessage(message) {
    try {
      const messageString = JSON.stringify(message);
      const encrypted = CryptoJS.AES.encrypt(messageString, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  // Decrypt message data
  decryptMessage(encryptedMessage) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, this.secretKey);
      const messageString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(messageString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Save sent message to local file (encrypted)
  saveSentMessage(message, room) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Only save messages sent by current user
    if (message.user !== user.username) return;

    const messageData = {
      ...message,
      room,
      savedAt: new Date().toISOString(),
      id: Date.now() + Math.random()
    };

    const encrypted = this.encryptMessage(messageData);
    if (!encrypted) return;

    if (this.isElectron && this.chatDir) {
      // Save to local file
      this.saveToFile(user.username, encrypted);
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage(user.username, encrypted);
    }
  }

  // Save to local file
  saveToFile(username, encryptedMessage) {
    try {
      const fs = window.require('fs-extra');
      const filePath = this.getUserChatFile(username);
      
      if (!filePath) {
        console.warn('No file path available, falling back to localStorage');
        this.saveToLocalStorage(username, encryptedMessage);
        return;
      }

      // Read existing messages
      let existingMessages = [];
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          if (fileContent.trim()) {
            existingMessages = JSON.parse(fileContent);
          }
        } catch (parseError) {
          console.warn('Failed to parse existing chat file, starting fresh:', parseError.message);
          existingMessages = [];
        }
      }

      // Add new message
      existingMessages.push(encryptedMessage);

      // Keep only last 500 messages to prevent file bloat
      const recentMessages = existingMessages.slice(-500);

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(recentMessages, null, 2));
      
      console.log(`💾 Message encrypted and saved to: ${filePath}`);
    } catch (error) {
      console.error('Failed to save to file:', error);
      // Fallback to localStorage
      this.saveToLocalStorage(username, encryptedMessage);
    }
  }

  // Fallback: Save to localStorage
  saveToLocalStorage(username, encryptedMessage) {
    try {
      const storageKey = `sentMessages_${username}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      existingMessages.push(encryptedMessage);
      const recentMessages = existingMessages.slice(-100);
      
      localStorage.setItem(storageKey, JSON.stringify(recentMessages));
      console.log('💾 Message encrypted and saved to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Get sent messages (decrypted)
  getSentMessages(room = null) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    let encryptedMessages = [];

    if (this.isElectron && this.chatDir) {
      // Read from local file
      encryptedMessages = this.readFromFile(user.username);
    } else {
      // Fallback to localStorage
      encryptedMessages = this.readFromLocalStorage(user.username);
    }

    try {
      const decryptedMessages = encryptedMessages
        .map(encrypted => this.decryptMessage(encrypted))
        .filter(msg => msg !== null);
      
      // Filter by room if specified
      if (room) {
        return decryptedMessages.filter(msg => msg.room === room);
      }
      
      return decryptedMessages;
    } catch (error) {
      console.error('Failed to retrieve sent messages:', error);
      return [];
    }
  }

  // Read from local file
  readFromFile(username) {
    try {
      const fs = window.require('fs-extra');
      const filePath = this.getUserChatFile(username);
      
      if (!filePath || !fs.existsSync(filePath)) return [];

      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (!fileContent.trim()) return [];

      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Failed to read from file:', error);
      return this.readFromLocalStorage(username);
    }
  }

  // Fallback: Read from localStorage
  readFromLocalStorage(username) {
    try {
      const storageKey = `sentMessages_${username}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  }

  // Clear all stored messages for current user
  clearSentMessages() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (this.isElectron && this.chatDir) {
      // Delete local file
      try {
        const fs = window.require('fs-extra');
        const filePath = this.getUserChatFile(user.username);
        
        if (filePath && fs.existsSync(filePath)) {
          fs.removeSync(filePath);
          console.log('🗑️ Local chat file deleted:', filePath);
        }
      } catch (error) {
        console.error('Failed to delete chat file:', error);
      }
    }

    // Also clear localStorage
    try {
      const storageKey = `sentMessages_${user.username}`;
      localStorage.removeItem(storageKey);
      console.log('🗑️ localStorage chat data cleared');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  // Get message statistics
  getMessageStats() {
    const messages = this.getSentMessages();
    const rooms = [...new Set(messages.map(msg => msg.room))];
    
    const stats = {
      totalMessages: messages.length,
      roomsCount: rooms.length,
      rooms: rooms,
      oldestMessage: messages.length > 0 ? messages[0].savedAt : null,
      newestMessage: messages.length > 0 ? messages[messages.length - 1].savedAt : null,
      storageLocation: this.isElectron && this.chatDir ? 'Local File (Encrypted)' : 'Browser Storage',
      storageSize: this.getStorageSize(),
      chatDirectory: this.getChatDirectory()
    };

    return stats;
  }

  // Get storage size information
  getStorageSize() {
    if (this.isElectron && this.chatDir) {
      try {
        const fs = window.require('fs-extra');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const filePath = this.getUserChatFile(user.username);
        
        if (filePath && fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const sizeInKB = (stats.size / 1024).toFixed(2);
          return `${sizeInKB} KB`;
        }
      } catch (error) {
        console.error('Failed to get file size:', error);
      }
    }
    
    // Fallback: estimate localStorage size
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const storageKey = `sentMessages_${user.username}`;
      const data = localStorage.getItem(storageKey) || '';
      const sizeInKB = (data.length / 1024).toFixed(2);
      return `${sizeInKB} KB`;
    } catch (error) {
      return '0 KB';
    }
  }

  // Get chat directory path for display
  getChatDirectory() {
    return this.chatDir || 'Browser Storage';
  }

  // Check if file storage is available
  isFileStorageAvailable() {
    return this.isElectron && this.chatDir !== null;
  }
}

const secureChatStorage = new SecureChatStorage();
export default secureChatStorage;