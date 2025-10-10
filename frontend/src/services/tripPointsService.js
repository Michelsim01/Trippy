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
   * Get user's transaction history
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Transaction history data
   */
  getTransactionHistory: async (userId) => {
    try {
      const response = await api.get(`/api/trip-points/user/${userId}/history`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transaction history'
      }
    }
  },

  /**
   * Award points for leaving a review
   * @param {number} userId - The user ID
   * @param {number} referenceId - Optional reference ID (review ID)
   * @returns {Promise<Object>} Award response
   */
  awardPointsForReview: async (userId, referenceId = null) => {
    try {
      const response = await api.post(`/api/trip-points/user/${userId}/award-review`, {
        referenceId
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
   * Get all TripPoints transactions (admin only)
   * @returns {Promise<Object>} All TripPoints data
   */
  getAllTransactions: async () => {
    try {
      const response = await api.get('/api/trip-points')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching all transactions:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transactions'
      }
    }
  },

  /**
   * Get transaction by ID
   * @param {number} transactionId - The transaction ID
   * @returns {Promise<Object>} Transaction data
   */
  getTransactionById: async (transactionId) => {
    try {
      const response = await api.get(`/api/trip-points/${transactionId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transaction'
      }
    }
  }
}

export default tripPointsService