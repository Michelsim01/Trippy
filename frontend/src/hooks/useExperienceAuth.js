import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for handling authentication and permissions for experience creation
 * @returns {Object} Authentication state and error handling
 */
export const useExperienceAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    if (!isAuthenticated) {
      setAuthError('You must be logged in to create experiences');
      setTimeout(() => navigate('/signin'), 2000);
      return;
    }

    if (!user) {
      setAuthError('User data not available');
      return;
    }

    // Check if user can create experiences (KYC approved)
    if (!user.canCreateExperiences || user.kycStatus !== 'APPROVED') {
      setAuthError('You must be a verified tour guide to create experiences. Please complete your KYC verification in your profile settings.');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    setAuthError(null);
  }, [isAuthenticated, isLoading, user, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    authError,
    setAuthError
  };
};
