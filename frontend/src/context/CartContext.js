import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get or create session ID
    let storedSessionId = localStorage.getItem('cart_session_id');
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem('cart_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
    fetchCart(storedSessionId);
  }, []);

  const fetchCart = async (sid) => {
    try {
      const response = await api.get(`/cart/${sid}`);
      setCart(response.data);
    } catch (error) {
      console.error('Cart fetch failed:', error);
    }
  };

  const addToCart = async (item) => {
    setLoading(true);
    try {
      const response = await api.post(`/cart/${sessionId}/items`, item);
      setCart(response.data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    setLoading(true);
    try {
      const response = await api.put(`/cart/${sessionId}/items/${cartItemId}?quantity=${quantity}`);
      setCart(response.data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    setLoading(true);
    try {
      const response = await api.delete(`/cart/${sessionId}/items/${cartItemId}`);
      setCart(response.data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await api.delete(`/cart/${sessionId}`);
      setCart({ items: [] });
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cart.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  const value = {
    cart,
    sessionId,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: () => fetchCart(sessionId),
    itemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
