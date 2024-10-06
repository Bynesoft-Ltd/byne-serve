import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser, setAuthToken } from '../services/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const loadUser = useCallback(async (authToken) => {
    if (!authToken) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setAuthToken(authToken);
      const userData = await getCurrentUser(authToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to load user', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser(token);
  }, [loadUser, token]);

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      await loadUser(data.access_token);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    setToken(null);
    setAuthToken(null);
  }, []);

  const register = async (username, email, password) => {
    try {
      await registerUser(username, email, password);
      return true;
    } catch (error) {
      console.error('Registration failed', error);
      return false;
    }
  };

  const checkAuthStatus = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== token) {
      setToken(storedToken);
      await loadUser(storedToken);
    } else if (!storedToken) {
      logout();
    }
  }, [token, loadUser, logout]);

  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

    const value = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    loading,
    checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
