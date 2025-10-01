import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { reviewService } from '../services/reviewService';
import { useAuth } from './AuthContext';

const ReviewContext = createContext();

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};

export const ReviewProvider = ({ children }) => {
  const { user } = useAuth();

  // State management
  const [reviews, setReviews] = useState({});
  const [pendingReviews, setPendingReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache for review stats by experience
  const [reviewStats, setReviewStats] = useState({});

  // Load pending reviews for current user
  const loadPendingReviews = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await reviewService.getPendingReviews(user.id);
      if (response.success) {
        setPendingReviews(response.data);
      } else {
        console.warn('Failed to load pending reviews:', response.error);
      }
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      setError('Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load user's written reviews
  const loadUserReviews = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await reviewService.getUserReviews(user.id);
      if (response.success) {
        setUserReviews(response.data);
      } else {
        console.warn('Failed to load user reviews:', response.error);
      }
    } catch (error) {
      console.error('Error loading user reviews:', error);
    }
  }, [user?.id]);

  // Load reviews for a specific experience
  const loadExperienceReviews = useCallback(async (experienceId) => {
    if (!experienceId) return [];

    try {
      setLoading(true);

      // Check if already cached
      if (reviews[experienceId]) {
        return reviews[experienceId];
      }

      const response = await reviewService.getExperienceReviews(experienceId);
      if (response.success) {
        setReviews(prev => ({
          ...prev,
          [experienceId]: response.data
        }));
        return response.data;
      } else {
        console.warn('Failed to load experience reviews:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading experience reviews:', error);
      setError('Failed to load reviews');
      return [];
    } finally {
      setLoading(false);
    }
  }, [reviews]);

  // Load review statistics for an experience
  const loadReviewStats = useCallback(async (experienceId) => {
    if (!experienceId) return null;

    try {
      // Check if already cached
      if (reviewStats[experienceId]) {
        return reviewStats[experienceId];
      }

      const response = await reviewService.getReviewStats(experienceId);
      if (response.success) {
        setReviewStats(prev => ({
          ...prev,
          [experienceId]: response.data
        }));
        return response.data;
      } else {
        console.warn('Failed to load review stats:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error loading review stats:', error);
      return null;
    }
  }, [reviewStats]);

  // Create a new review
  const createReview = useCallback(async (reviewData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.createReview(reviewData);

      if (response.success) {
        // Update cached data - get experienceId from response or pass it separately
        const experienceId = response.data?.experienceId || reviewData.experienceId;

        // Ensure bookingId is included in the review data
        // Backend might not return it, so we add it from our request data
        const reviewWithBookingId = {
          ...response.data,
          bookingId: response.data?.bookingId || response.data?.booking?.bookingId || reviewData.bookingId
        };

        // Add to experience reviews cache
        setReviews(prev => ({
          ...prev,
          [experienceId]: [reviewWithBookingId, ...(prev[experienceId] || [])]
        }));

        // Add to user reviews
        setUserReviews(prev => [reviewWithBookingId, ...prev]);

        // Clear stats cache for this experience to force reload
        setReviewStats(prev => {
          const updated = { ...prev };
          delete updated[experienceId];
          return updated;
        });

        return { success: true, data: reviewWithBookingId };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error creating review:', error);
      setError('Failed to create review');
      return { success: false, error: 'Failed to create review' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing review
  const updateReview = useCallback(async (reviewId, reviewData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.updateReview(reviewId, reviewData);
      if (response.success) {
        const experienceId = response.data.experience.experienceId;

        // Update experience reviews cache
        setReviews(prev => ({
          ...prev,
          [experienceId]: prev[experienceId]?.map(review =>
            review.reviewId === reviewId ? response.data : review
          ) || []
        }));

        // Update user reviews
        setUserReviews(prev =>
          prev.map(review =>
            review.reviewId === reviewId ? response.data : review
          )
        );

        // Clear stats cache to force reload
        setReviewStats(prev => {
          const updated = { ...prev };
          delete updated[experienceId];
          return updated;
        });

        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error updating review:', error);
      setError('Failed to update review');
      return { success: false, error: 'Failed to update review' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a review
  const deleteReview = useCallback(async (reviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.deleteReview(reviewId);
      if (response.success) {
        // Remove from all caches
        setReviews(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(experienceId => {
            updated[experienceId] = updated[experienceId].filter(
              review => review.reviewId !== reviewId
            );
          });
          return updated;
        });

        setUserReviews(prev => prev.filter(review => review.reviewId !== reviewId));

        // Clear all stats cache to force reload
        setReviewStats({});

        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('Failed to delete review');
      return { success: false, error: 'Failed to delete review' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user can review a booking
  const canReviewBooking = useCallback(async (bookingId) => {
    if (!user?.id || !bookingId) return false;

    try {
      const response = await reviewService.canReviewBooking(bookingId, user.id);
      return response.success ? response.data : false;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return false;
    }
  }, [user?.id]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear all cached data (useful for logout)
  const clearCache = useCallback(() => {
    setReviews({});
    setPendingReviews([]);
    setUserReviews([]);
    setReviewStats({});
    setError(null);
  }, []);

  // Load initial data when user changes
  useEffect(() => {
    if (user?.id) {
      loadPendingReviews();
      loadUserReviews();
    } else {
      clearCache();
    }
  }, [user?.id, loadPendingReviews, loadUserReviews, clearCache]);

  // Context value
  const value = {
    // State
    reviews,
    pendingReviews,
    userReviews,
    reviewStats,
    loading,
    error,

    // Actions
    loadExperienceReviews,
    loadReviewStats,
    loadPendingReviews,
    loadUserReviews,
    createReview,
    updateReview,
    deleteReview,
    canReviewBooking,
    clearError,
    clearCache,

    // Utilities
    getExperienceReviews: (experienceId) => reviews[experienceId] || [],
    getReviewStats: (experienceId) => reviewStats[experienceId] || null,
    hasReviewForBooking: (bookingId) => {
      return userReviews.some(review => {
        const reviewBookingId = review.booking?.bookingId || review.bookingId;
        return reviewBookingId === bookingId;
      });
    }
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

export default ReviewProvider;