import axios from 'axios';

// Get API URL - always use HTTPS in production
const getApiUrl = () => {
  // If on HTTPS, force HTTPS for API
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `https://${window.location.host}`;
  }
  // Fallback to env variable
  return process.env.REACT_APP_BACKEND_URL || '';
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
