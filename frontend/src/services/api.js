// Direct XMLHttpRequest to bypass potential fetch interceptors
const API_BASE = '/api';

const makeRequest = (method, url, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}${url}`, true);
    
    xhr.setRequestHeader('Content-Type', 'application/json');
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key]);
    });
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve({ data: JSON.parse(xhr.responseText) });
        } catch (e) {
          resolve({ data: xhr.responseText });
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error'));
    };
    
    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  });
};

const api = {
  get: (url, options = {}) => makeRequest('GET', url, null, options.headers),
  post: (url, data, options = {}) => makeRequest('POST', url, data, options.headers),
  put: (url, data, options = {}) => makeRequest('PUT', url, data, options.headers),
  delete: (url, options = {}) => makeRequest('DELETE', url, null, options.headers)
};

export default api;
