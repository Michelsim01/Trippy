import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data from backend (using test user ID 1)
        const response = await axios.get('http://localhost:8080/api/users/1');
        const userData = response.data;

        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          kycStatus: userData.kycStatus,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to mock data if API fails
        setUser({
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          kycStatus: 'NOT_STARTED',
          isAuthenticated: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const login = (userData) => {
    setUser({ ...userData, isAuthenticated: true });
    localStorage.setItem('authToken', 'mock-token');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const updateKycStatus = (status) => {
    if (user) {
      setUser({ ...user, kycStatus: status });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateKycStatus,
    isAuthenticated: !!user?.isAuthenticated
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};