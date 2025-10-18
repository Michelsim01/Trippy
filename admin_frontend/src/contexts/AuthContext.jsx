import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = () => {
      if (token) {
        // Try to get user info from stored token
        const storedUser = localStorage.getItem('admin_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            // Clear invalid data
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No stored user data, but we have a token
          // This shouldn't happen in normal flow, but clear everything
          localStorage.removeItem('admin_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password
      });

      const authData = response.data;
      
      // Check if user has admin role
      const isAdmin = authData.roles && authData.roles.includes('ROLE_ADMIN');
      
      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Create user object from auth response
      const userData = {
        id: authData.userId,
        firstName: authData.username.split(' ')[0],
        lastName: authData.username.split(' ')[1] || '',
        email: authData.email,
        isAdmin: true,
        emailVerified: authData.emailVerified
      };

      localStorage.setItem('admin_token', authData.token);
      localStorage.setItem('admin_user', JSON.stringify(userData));
      setToken(authData.token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const signup = async (formData) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        adminCode: formData.adminCode
      });

      // Registration creates a pending user, not an immediate login
      return { 
        success: true, 
        message: 'Registration successful! Please check your email for verification instructions.',
        requiresVerification: true
      };
    } catch (error) {
      console.error('Signup failed:', error);
      
      // Handle different error response formats
      let errorMessage = 'Signup failed';
      
      if (error.response?.data) {
        // Backend returns error as plain string in response body
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    token,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
