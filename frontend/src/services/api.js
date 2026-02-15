import axios from 'axios';

// Force HTTPS - hardcode the backend URL
const BACKEND_URL = 'https://custom-mug-designer-1.preview.emergentagent.com';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
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
