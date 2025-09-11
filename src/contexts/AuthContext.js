import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Configure axios defaults
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        const userData = JSON.parse(savedUser);
        
        // Verify token with backend
        try {
          const response = await axios.get(`${API_BASE_URL}/profile`);
          if (response.data.success) {
            setUser(response.data.user);
            setToken(savedToken);
            setIsAuthenticated(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          } else {
            // Token is invalid, clear storage
            clearAuth();
          }
        } catch (error) {
          // Token is invalid, clear storage
          clearAuth();
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        setUser(userData);
        setToken(newToken);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  }, [API_BASE_URL]);

  const register = useCallback(async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, userData);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        setUser(newUser);
        setToken(newToken);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true, user: newUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  }, [API_BASE_URL]);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/profile`, profileData);

      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || 'Profile update failed. Please try again.';
      return { success: false, message };
    }
  }, [API_BASE_URL]);

  const isGovernment = useCallback(() => {
    return user?.role === 'government';
  }, [user]);

  const isUser = useCallback(() => {
    return user?.role === 'user';
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    isGovernment,
    isUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
