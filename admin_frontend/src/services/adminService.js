import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  /**
   * Get dashboard metrics
   * @returns {Promise<Object>} Dashboard metrics data
   */
  getDashboardMetrics: async () => {
    try {
      const response = await api.get('/api/admin/dashboard/metrics');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch dashboard metrics'
      };
    }
  },

  /**
   * Get user management data
   * @returns {Promise<Object>} User data
   */
  getUsers: async () => {
    try {
      const response = await api.get('/api/users');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch users'
      };
    }
  },

  /**
   * Get all users with booking counts for admin panel
   * @returns {Promise<Object>} Users with booking counts
   */
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/admin/users');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching all users:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch all users'
      };
    }
  },

  /**
   * Get experiences data
   * @returns {Promise<Object>} Experiences data
   */
  getExperiences: async () => {
    try {
      const response = await api.get('/api/experiences');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching experiences:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch experiences'
      };
    }
  },

  /**
   * Get bookings data
   * @returns {Promise<Object>} Bookings data
   */
  getBookings: async () => {
    try {
      const response = await api.get('/api/bookings');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch bookings'
      };
    }
  },

  /**
   * Get user management metrics
   * @returns {Promise<Object>} User management metrics data
   */
  getUserManagementMetrics: async () => {
    try {
      const response = await api.get('/api/admin/users/metrics');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching user management metrics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch user management metrics'
      };
    }
  },

  /**
   * Update user details
   * @param {number} userId - The user ID
   * @param {Object} userData - The user data to update
   * @returns {Promise<Object>} Updated user data
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}`, userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update user'
      };
    }
  },

  /**
   * Suspend user account
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Updated user data
   */
  suspendUser: async (userId) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/suspend`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error suspending user:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to suspend user'
      };
    }
  },

  /**
   * Activate user account
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Updated user data
   */
  activateUser: async (userId) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/activate`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error activating user:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to activate user'
      };
    }
  },

  /**
   * Delete user account
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete user'
      };
    }
  },

  /**
   * Get revenue chart data
   * @returns {Promise<Object>} Revenue chart data
   */
  getRevenueChartData: async () => {
    try {
      const response = await api.get('/api/admin/charts/revenue');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching revenue chart data:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch revenue chart data'
      };
    }
  },

  /**
   * Get categories chart data
   * @returns {Promise<Object>} Categories chart data
   */
  getCategoriesChartData: async () => {
    try {
      const response = await api.get('/api/admin/charts/categories');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching categories chart data:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories chart data'
      };
    }
  },

  /**
   * Get top performing experiences
   * @returns {Promise<Object>} Top performing experiences data
   */
  getTopPerformingExperiences: async () => {
    try {
      const response = await api.get('/api/admin/dashboard/top-experiences');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching top performing experiences:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch top performing experiences'
      };
    }
  },

  /**
   * Get pending experiences awaiting approval
   * @returns {Promise<Object>} Pending experiences data
   */
  getPendingExperiences: async () => {
    try {
      const response = await api.get('/api/admin/dashboard/pending-experiences');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching pending experiences:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch pending experiences'
      };
    }
  },

  /**
   * Get experience management metrics
   * @returns {Promise<Object>} Experience management metrics
   */
  getExperienceManagementMetrics: async () => {
    try {
      const response = await api.get('/api/admin/experiences/metrics');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching experience management metrics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch experience management metrics'
      };
    }
  },

  /**
   * Get all experiences with review and booking counts
   * @returns {Promise<Object>} Experiences with counts
   */
  getAllExperiences: async () => {
    try {
      const response = await api.get('/api/admin/experiences');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching all experiences:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch all experiences'
      };
    }
  },

  /**
   * Update experience details
   * @param {number} experienceId - Experience ID
   * @param {Object} experienceData - Experience data to update
   * @returns {Promise<Object>} Updated experience
   */
  updateExperience: async (experienceId, experienceData) => {
    try {
      const response = await api.put(`/api/admin/experiences/${experienceId}`, experienceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating experience:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update experience'
      };
    }
  },

  /**
   * Update experience status
   * @param {number} experienceId - Experience ID
   * @param {string} status - New status (ACTIVE, INACTIVE, SUSPENDED)
   * @returns {Promise<Object>} Updated experience
   */
  updateExperienceStatus: async (experienceId, status) => {
    try {
      const response = await api.patch(`/api/admin/experiences/${experienceId}/status`, { status });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating experience status:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update experience status'
      };
    }
  },

  /**
   * Suspend experience
   * @param {number} experienceId - Experience ID
   * @returns {Promise<Object>} Updated experience
   */
  suspendExperience: async (experienceId) => {
    try {
      const response = await api.patch(`/api/admin/experiences/${experienceId}/suspend`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error suspending experience:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to suspend experience'
      };
    }
  },

  /**
   * Delete experience
   * @param {number} experienceId - Experience ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteExperience: async (experienceId) => {
    try {
      const response = await api.delete(`/api/admin/experiences/${experienceId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting experience:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete experience'
      };
    }
  }
};

export default adminService;
