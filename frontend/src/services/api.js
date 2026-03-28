import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  join: (data) => api.post('/auth/join', data)   // { username, roomId, passcode? }
};

export const roomAPI = {
  getRooms:    ()       => api.get('/rooms'),
  createRoom:  (data)   => api.post('/rooms', data),
  getMessages: (roomId) => api.get(`/rooms/${roomId}/messages`),
  deleteRoom:  (roomId) => api.delete(`/rooms/${roomId}`)
};

export default api;
