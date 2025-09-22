import axios from 'axios'

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export const tripPointsService = {
  /**
   * Get TripPoints data for a specific user
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} TripPoints data
   */
  getTripPointsByUserId: async (userId) => {
    try {
      const response = await api.get(`/api/trip-points/user/${userId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching TripPoints:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch TripPoints'
      }
    }
  },

  /**
   * Get user's points balance summary
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Points balance data
   */
  getUserPointsBalance: async (userId) => {
    try {
      const response = await api.get(`/api/trip-points/user/${userId}/balance`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching points balance:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch points balance'
      }
    }
  },

  /**
   * Award points for leaving a review
   * @param {number} userId - The user ID
   * @param {number} pointsEarned - Points earned from the review
   * @returns {Promise<Object>} Award response
   */
  awardPointsForReview: async (userId, pointsEarned) => {
    try {
      const response = await api.post(`/api/trip-points/user/${userId}/award-review`, {
        pointsEarned
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error awarding points for review:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to award points for review'
      }
    }
  },

  /**
   * Award points for completing an experience
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Award response
   */
  awardPointsForExperience: async (userId) => {
    try {
      const response = await api.post(`/api/trip-points/user/${userId}/award-experience`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error awarding points for experience:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to award points for experience'
      }
    }
  },

  /**
   * Redeem points
   * @param {number} userId - The user ID
   * @param {number} pointsToRedeem - Points to redeem
   * @returns {Promise<Object>} Redemption response
   */
  redeemPoints: async (userId, pointsToRedeem) => {
    try {
      const response = await api.post(`/api/trip-points/user/${userId}/redeem`, {
        pointsToRedeem
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to redeem points'
      }
    }
  },

  /**
   * Get TripPoints leaderboard
   * @returns {Promise<Object>} Leaderboard data
   */
  getLeaderboard: async () => {
    try {
      const response = await api.get('/api/trip-points/leaderboard')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch leaderboard'
      }
    }
  },

  /**
   * Get points policy information
   * @returns {Promise<Object>} Points policy data
   */
  getPointsPolicy: async () => {
    try {
      const response = await api.get('/api/trip-points/policy')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching points policy:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch points policy'
      }
    }
  },

  /**
   * Get all TripPoints records (admin only)
   * @returns {Promise<Object>} All TripPoints data
   */
  getAllTripPoints: async () => {
    try {
      const response = await api.get('/api/trip-points')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching all TripPoints:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch TripPoints'
      }
    }
  }
}

export default tripPointsService
