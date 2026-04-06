import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { SESSION_CHECK_INTERVAL_MS } from '../utils/constants';

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(sessionStorage.getItem('adminToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setAdminToken(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    if (adminToken && !isTokenExpired(adminToken)) {
      sessionStorage.setItem('adminToken', adminToken);
      setIsAuthenticated(true);
    } else {
      sessionStorage.removeItem('adminToken');
      setAdminToken(null);
      setIsAuthenticated(false);
    }
  }, [adminToken, isTokenExpired]);

  // Auto-logout check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (adminToken && isTokenExpired(adminToken)) {
        logout();
      }
    }, SESSION_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [adminToken, isTokenExpired, logout]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/admin/login', { email, password });
      setAdminToken(response.data.access_token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Inloggning misslyckades' };
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = useCallback(() => {
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  }, [adminToken]);

  const value = {
    isAuthenticated,
    loading,
    login,
    logout,
    getAuthHeaders,
    adminToken,
    setAdminToken
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
