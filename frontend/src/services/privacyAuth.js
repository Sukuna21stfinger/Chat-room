import CryptoJS from 'crypto-js';

class PrivacyAuth {
  constructor() { this.sessionTimeout = 24 * 60 * 60 * 1000; }

  generateSessionToken(userData) {
    const timestamp = Date.now();
    const expires = timestamp + this.sessionTimeout;
    const hash = CryptoJS.SHA256(JSON.stringify({ user: userData, timestamp, expires })).toString();
    return { user: userData, timestamp, expires, hash };
  }

  validateSession(token) {
    if (!token) return false;
    try {
      const { user, timestamp, expires, hash } = token;
      if (Date.now() > expires) { this.clearSession(); return false; }
      const expected = CryptoJS.SHA256(JSON.stringify({ user, timestamp, expires })).toString();
      if (hash !== expected) { this.clearSession(); return false; }
      return true;
    } catch { this.clearSession(); return false; }
  }

  storeSession(userData, token = null) {
    const session = this.generateSessionToken(userData);
    sessionStorage.setItem('chatSession', JSON.stringify(session));
    localStorage.setItem('user', JSON.stringify({ id: userData.id, username: userData.username, email: userData.email }));
    if (token) localStorage.setItem('token', token);
    return session;
  }

  getCurrentSession() {
    try {
      const data = sessionStorage.getItem('chatSession');
      if (!data) return null;
      const token = JSON.parse(data);
      return this.validateSession(token) ? token : null;
    } catch { return null; }
  }

  isAuthenticated() { return this.getCurrentSession() !== null; }
  getCurrentUser() { const s = this.getCurrentSession(); return s ? s.user : null; }

  clearSession() {
    sessionStorage.removeItem('chatSession');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  setupAutoLogout() {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { this.clearSession(); window.location.href = '/login'; }, 30 * 60 * 1000);
    };
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(e => document.addEventListener(e, reset, true));
    reset();
  }

  generateAnonymousUsername() {
    const adj = ['Swift', 'Bright', 'Cool', 'Smart', 'Quick', 'Silent', 'Mystic', 'Cosmic'];
    const noun = ['Fox', 'Eagle', 'Wolf', 'Tiger', 'Falcon', 'Phoenix', 'Dragon', 'Lion'];
    return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${Math.floor(Math.random() * 1000)}`;
  }
}

export default new PrivacyAuth();
