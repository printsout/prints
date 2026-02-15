import axios from 'axios';

// Use relative URL - will automatically use same protocol and host
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add trailing slash for FastAPI compatibility
api.interceptors.request.use((config) => {
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url = `${config.url}/`;
  }
  return config;
});

export default api;
