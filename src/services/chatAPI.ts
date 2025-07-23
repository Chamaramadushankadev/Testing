import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5173';

const chatAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to headers
chatAPI.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
  } else {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle global errors
chatAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Chat API Error:', error);
    return Promise.reject({
      message: error.response?.data?.message || error.message || 'Network error',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    });
  }
);

// Channels API
export const channelsAPI = {
  getAll: () => chatAPI.get('/channels'),
  create: (data: any) => chatAPI.post('/channels', data),
  update: (id: string, data: any) => chatAPI.put(`/channels/${id}`, data),
  delete: (id: string) => chatAPI.delete(`/channels/${id}`),
  join: (id: string) => chatAPI.post(`/channels/${id}/join`),
  leave: (id: string) => chatAPI.post(`/channels/${id}/leave`),
  updateMemberRole: (channelId: string, userId: string, role: string) => 
    chatAPI.put(`/channels/${channelId}/members/${userId}/role`, { role })
};

// Messages API
export const messagesAPI = {
  getByChannel: (channelId: string, params?: any) => 
    chatAPI.get(`/messages/channel/${channelId}`, { params }),
  send: (data: any) => chatAPI.post('/messages', data),
  edit: (id: string, data: any) => chatAPI.put(`/messages/${id}`, data),
  delete: (id: string) => chatAPI.delete(`/messages/${id}`)
};

export default chatAPI;