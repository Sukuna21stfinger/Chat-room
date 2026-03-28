const USERNAME_REGEX = /^[A-Za-z0-9 _-]{2,30}$/;
const ROOM_REGEX = /^[A-Za-z0-9_ -]{2,64}$/; // Allow spaces for "THE RED ROOM"

const escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const sanitizeText = (value) => String(value || '')
  .replace(/[&<>"']/g, (char) => escapeMap[char])
  .replace(/[\u0000-\u001F\u007F]/g, '')
  .trim();

const isValidUsername = (username) => USERNAME_REGEX.test(username);
const isValidRoomId = (roomId) => ROOM_REGEX.test(roomId);

const isSafeUrl = (value) => {
  if (!value || typeof value !== 'string' || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

module.exports = {
  sanitizeText,
  isValidUsername,
  isValidRoomId,
  isSafeUrl
};
