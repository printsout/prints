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
  const [isAuthenticated, setIsAuthenticated] = useState(!!adminToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
    }
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
    adminToken
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
