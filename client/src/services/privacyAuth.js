import CryptoJS from 'crypto-js';

class PrivacyAuth {
  constructor() {
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Generate secure session token
  generateSessionToken(userData) {
    const timestamp = Date.now();
    const sessionData = {
      user: userData,
      timestamp,
      expires: timestamp + this.sessionTimeout
    };
    
    // Create a hash of session data for integrity
    const sessionHash = CryptoJS.SHA256(JSON.stringify(sessionData)).toString();
    
    return {
      ...sessionData,
      hash: sessionHash
    };
  }

  // Validate session token
  validateSession(sessionToken) {
    if (!sessionToken) return false;
    
    try {
      const { user, timestamp, expires, hash } = sessionToken;
      
      // Check if session has expired
      if (Date.now() > expires) {
        this.clearSession();
        return false;
      }
      
      // Verify session integrity
      const expectedHash = CryptoJS.SHA256(JSON.stringify({ user, timestamp, expires })).toString();
      if (hash !== expectedHash) {
        this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      this.clearSession();
      return false;
    }
  }

  // Store session securely
  storeSession(userData, token = null) {
    const sessionToken = this.generateSessionToken(userData);
    
    // Store in sessionStorage (cleared when browser closes)
    sessionStorage.setItem('chatSession', JSON.stringify(sessionToken));
    
    // Store minimal user info in localStorage for convenience
    localStorage.setItem('user', JSON.stringify({
      id: userData.id,
      username: userData.username,
      email: userData.email
    }));

    // Also persist the JWT token for API authorization
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return sessionToken;
  }

  // Get current session
  getCurrentSession() {
    try {
      const sessionData = sessionStorage.getItem('chatSession');
      if (!sessionData) return null;
      
      const sessionToken = JSON.parse(sessionData);
      
      if (this.validateSession(sessionToken)) {
        return sessionToken;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getCurrentSession();
    return session !== null;
  }

  // Get current user safely
  getCurrentUser() {
    const session = this.getCurrentSession();
    return session ? session.user : null;
  }

  // Clear session and logout
  clearSession() {
    sessionStorage.removeItem('chatSession');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Clear old token if exists
  }

  // Auto-logout on inactivity
  setupAutoLogout() {
    let inactivityTimer;
    const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.clearSession();
        window.location.href = '/login';
      }, inactivityTimeout);
    };
    
    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    resetTimer(); // Start the timer
  }

  // Generate secure random username (for privacy)
  generateAnonymousUsername() {
    const adjectives = ['Swift', 'Bright', 'Cool', 'Smart', 'Quick', 'Silent', 'Mystic', 'Cosmic'];
    const nouns = ['Fox', 'Eagle', 'Wolf', 'Tiger', 'Falcon', 'Phoenix', 'Dragon', 'Lion'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    
    return `${adjective}${noun}${number}`;
  }
}

export default new PrivacyAuth();