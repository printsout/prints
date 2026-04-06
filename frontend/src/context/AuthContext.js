import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { SESSION_CHECK_INTERVAL_MS } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check token expiration
  const isTokenExpired = useCallback((t) => {
    if (!t) return true;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      fetchProfile();
    } else if (token && isTokenExpired(token)) {
      logout();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token, isTokenExpired, fetchProfile, logout]);

  // Auto-logout check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && isTokenExpired(token)) {
        logout();
      }
    }, SESSION_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, isTokenExpired, logout]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = response.data;
    sessionStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { access_token, user: userData } = response.data;
    sessionStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
