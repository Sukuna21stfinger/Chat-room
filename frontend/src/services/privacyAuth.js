class PrivacyAuth {
  constructor() { this.sessionTimeout = 90 * 60 * 1000; } // 1.5 hours

  storeSession(userData, token) {
    const expires = Date.now() + this.sessionTimeout;
    sessionStorage.setItem('chatSession', JSON.stringify({ user: userData, expires }));
    if (token) localStorage.setItem('token', token);
  }

  getCurrentSession() {
    try {
      const data = sessionStorage.getItem('chatSession');
      if (!data) return null;
      const session = JSON.parse(data);
      if (Date.now() > session.expires) { this.clearSession(); return null; }
      return session;
    } catch { return null; }
  }

  isAuthenticated() { return this.getCurrentSession() !== null; }
  getCurrentUser()  { const s = this.getCurrentSession(); return s ? s.user : null; }

  clearSession() {
    sessionStorage.removeItem('chatSession');
    localStorage.removeItem('token');
  }

  setupAutoLogout() {
    const session = this.getCurrentSession();
    if (!session) return;
    const remaining = session.expires - Date.now();
    setTimeout(() => { this.clearSession(); window.location.href = '/'; }, remaining);
  }

  generateAnonymousUsername() {
    const adj  = ['Swift', 'Bright', 'Cool', 'Silent', 'Mystic', 'Cosmic', 'Dark', 'Neon'];
    const noun = ['Fox', 'Eagle', 'Wolf', 'Tiger', 'Falcon', 'Phoenix', 'Dragon', 'Ghost'];
    return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${Math.floor(Math.random() * 1000)}`;
  }
}

export default new PrivacyAuth();
