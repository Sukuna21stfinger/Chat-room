import axios from 'axios';

// Use environment variable or fallback to production server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData)
};

// Guest auth
authAPI.guest = () => api.post('/auth/guest');

export const roomAPI = {
  getRooms: () => api.get('/rooms'),
  createRoom: (roomData) => api.post('/rooms', roomData),
  getMessages: (roomId) => api.get(`/rooms/${roomId}/messages`),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`)
};

export default api;