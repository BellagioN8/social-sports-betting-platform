import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const scoresAPI = {
  getAll: () => apiClient.get('/scores'),
  getUpcoming: (days) => apiClient.get(`/scores/upcoming?days=${days}`),
  getBySport: (sport) => apiClient.get(`/scores?sport=${sport}`),
};

export const betsAPI = {
  getAll: () => apiClient.get('/bets'),
  create: (betData) => apiClient.post('/bets', betData),
  update: (id, betData) => apiClient.put(`/bets/${id}`, betData),
  delete: (id) => apiClient.delete(`/bets/${id}`),
  getById: (id) => apiClient.get(`/bets/${id}`),
};

export const groupsAPI = {
  getAll: () => apiClient.get('/groups'),
  create: (groupData) => apiClient.post('/groups', groupData),
  join: (groupId, joinCode) => apiClient.post(`/groups/${groupId}/join`, { joinCode }),
  leave: (groupId) => apiClient.post(`/groups/${groupId}/leave`),
  getById: (id) => apiClient.get(`/groups/${id}`),
  getMessages: (id) => apiClient.get(`/groups/${id}/messages`),
  sendMessage: (id, content) => apiClient.post(`/groups/${id}/messages`, { content }),
};

export default apiClient;
