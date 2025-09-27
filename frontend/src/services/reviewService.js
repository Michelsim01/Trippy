import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export const reviewService = {
  // Get all reviews for an experience
  async getExperienceReviews(experienceId) {
    try {
      const response = await api.get(`/reviews/experience/${experienceId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching experience reviews:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch reviews'
      };
    }
  },

  // Get reviews by user (for their profile)
  async getUserReviews(userId) {
    try {
      const response = await api.get(`/reviews/user/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch user reviews'
      };
    }
  },

  // Get reviews that can be written (completed bookings without reviews)
  async getPendingReviews(userId) {
    try {
      const response = await api.get(`/reviews/user/${userId}/pending`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch pending reviews'
      };
    }
  },

  // Create a new review
  async createReview(reviewData) {
    try {
      console.log('📡 ReviewService: Received data:', reviewData);

      // Only send fields that backend expects
      const backendData = {
        bookingId: reviewData.bookingId,
        reviewerId: reviewData.reviewerId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment
      };

      console.log('📡 ReviewService: Sending to backend:', backendData);

      const response = await api.post('/reviews', backendData);
      console.log('📡 ReviewService: Backend response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('📡 ReviewService: Error creating review:', error);
      console.error('📡 ReviewService: Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create review'
      };
    }
  },

  // Update an existing review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update review'
      };
    }
  },

  // Delete a review
  async deleteReview(reviewId) {
    try {
      await api.delete(`/reviews/${reviewId}`);
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete review'
      };
    }
  },

  // Upload review photos
  async uploadReviewPhotos(reviewId, photos) {
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
      formData.append('reviewId', reviewId);

      const response = await api.post(`/reviews/${reviewId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error uploading review photos:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload photos'
      };
    }
  },

  // Get review statistics for an experience
  async getReviewStats(experienceId) {
    try {
      const response = await api.get(`/experiences/${experienceId}/review-stats`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch review statistics'
      };
    }
  },

  // Check if user can review a booking (simplified - backend handles validation)
  async canReviewBooking(bookingId, userId) {
    // For now, just return true - the backend will validate when creating the review
    // This prevents the non-existent endpoint call that was causing errors
    return {
      success: true,
      data: true
    };
  },

  // Report a review
  async reportReview(reviewId, reason) {
    try {
      const response = await api.post(`/reviews/${reviewId}/report`, { reason });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error reporting review:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to report review'
      };
    }
  }
};