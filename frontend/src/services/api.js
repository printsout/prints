import axios from 'axios';

// Ensure HTTPS is used
const getApiUrl = () => {
  const url = process.env.REACT_APP_BACKEND_URL || '';
  // Force HTTPS if on production
  if (url.startsWith('http://') && window.location.protocol === 'https:') {
    return url.replace('http://', 'https://');
  }
  return url;
};

export const API_BASE_URL = getApiUrl();
export const API = `${API_BASE_URL}/api`;

// Create axios instance with proper config
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to ensure URLs have trailing slash for FastAPI
api.interceptors.request.use((config) => {
  // Add trailing slash if missing and not a query string
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url = `${config.url}/`;
  }
  return config;
});

export default api;
