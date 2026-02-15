// Use full HTTPS URL to avoid mixed content issues
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return '/api';
};

const makeRequest = async (method, url, data = null, headers = {}) => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${url}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await window.fetch(fullUrl, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  return { data: responseData };
};

const api = {
  get: (url, options = {}) => makeRequest('GET', url, null, options.headers),
  post: (url, data, options = {}) => makeRequest('POST', url, data, options.headers),
  put: (url, data, options = {}) => makeRequest('PUT', url, data, options.headers),
  delete: (url, options = {}) => makeRequest('DELETE', url, null, options.headers)
};

export default api;
