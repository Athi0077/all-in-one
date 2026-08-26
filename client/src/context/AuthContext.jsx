import { createContext, useState, useEffect } from 'react';
import { login as loginService, register as registerService, logout as logoutService, getAuthMe } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          // Optimistically set user from localStorage to prevent flicker
          setUser(storedUser);
          
          // Verify with backend to get latest DB role
          const freshData = await getAuthMe();
          if (freshData && freshData.data) {
             const updatedUser = { ...storedUser, ...freshData.data };
             setUser(updatedUser);
             localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
           console.error("Failed to verify auth session:", error);
           // Optional: clear auth if strict verification is required
           // logoutService();
           // setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginService(email, password);
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
      return null;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerService(userData);
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
      return null;
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
