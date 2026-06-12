import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Empty string uses relative path (current domain)
});

// Interceptor to inject bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed && parsed.userId) {
        config.headers['X-User-Id'] = parsed.userId.toString();
      }
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
