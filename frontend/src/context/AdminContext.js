import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTokenExpired = (t) => {
    if (!t) return true;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (adminToken && !isTokenExpired(adminToken)) {
      localStorage.setItem('adminToken', adminToken);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('adminToken');
      setAdminToken(null);
      setIsAuthenticated(false);
    }
  }, [adminToken]);

  // Auto-logout check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (adminToken && isTokenExpired(adminToken)) {
        logout();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [adminToken]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/admin/login', { email, password });
      setAdminToken(response.data.access_token);
      return { success: true };
    } catch (error) {
      console.error('Admin login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Inloggning misslyckades' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  };

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
