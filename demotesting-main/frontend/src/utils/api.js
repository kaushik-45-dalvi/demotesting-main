import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8000/api';
export const API = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;