import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor() { this.key = this._getKey(); }

  _getKey() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const id = user.id || user.username || 'anon';
    let k = localStorage.getItem(`chatKey_${id}`);
    if (!k) { k = CryptoJS.SHA256(id + Date.now() + Math.random()).toString(); localStorage.setItem(`chatKey_${id}`, k); }
    return k;
  }

  _encrypt(data) { try { return CryptoJS.AES.encrypt(JSON.stringify(data), this.key).toString(); } catch { return null; } }
  _decrypt(enc) { try { return JSON.parse(CryptoJS.AES.decrypt(enc, this.key).toString(CryptoJS.enc.Utf8)); } catch { return null; } }

  saveSentMessage(message, room) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (message.user !== user.username) return;
    const enc = this._encrypt({ ...message, room, savedAt: new Date().toISOString() });
    if (!enc) return;
    const key = `msgs_${user.username}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(enc);
    localStorage.setItem(key, JSON.stringify(existing.slice(-200)));
  }

  getSentMessages(room = null) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const raw = JSON.parse(localStorage.getItem(`msgs_${user.username}`) || '[]');
    const msgs = raw.map(e => this._decrypt(e)).filter(Boolean);
    return room ? msgs.filter(m => m.room === room) : msgs;
  }

  clearSentMessages() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.removeItem(`msgs_${user.username}`);
  }

  getMessageStats() {
    const msgs = this.getSentMessages();
    const rooms = [...new Set(msgs.map(m => m.room))];
    return { totalMessages: msgs.length, roomsCount: rooms.length, storageLocation: 'Browser (Encrypted)', storageSize: `${(JSON.stringify(msgs).length / 1024).toFixed(1)} KB` };
  }

  isFileStorageAvailable() { return false; }
}

export default new SecureStorage();
