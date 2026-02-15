import axios from 'axios';

// Create axios instance
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic base URL resolver - runs on every request
api.interceptors.request.use((config) => {
  // Determine base URL dynamically
  let baseUrl = '';
  
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    baseUrl = `https://${window.location.host}`;
  } else {
    baseUrl = process.env.REACT_APP_BACKEND_URL || '';
  }
  
  // Set base URL for this request
  if (!config.baseURL) {
    config.baseURL = `${baseUrl}/api`;
  }
  
  // Add trailing slash if missing and not a query string
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url = `${config.url}/`;
  }
  
  return config;
});

export default api;
