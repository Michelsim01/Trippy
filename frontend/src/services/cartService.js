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
      // Token expired or invalid for protected routes
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Don't redirect automatically, let the component handle it
    }
    return Promise.reject(error)
  }
)

export const cartService = {
  /**
   * Add an item to the cart
   * @param {number} userId - ID of the user
   * @param {number} scheduleId - ID of the experience schedule
   * @param {number} numberOfParticipants - Number of participants
   * @returns {Promise} Response with cart item data
   */
  async addToCart(userId, scheduleId, numberOfParticipants) {
    try {
      const response = await api.post('/api/cart/items', {
        userId,
        scheduleId,
        numberOfParticipants,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to add item to cart',
      }
    }
  },

  /**
   * Get all cart items for a user
   * @param {number} userId - ID of the user
   * @returns {Promise} Response with cart items array
   */
  async getUserCart(userId) {
    try {
      const response = await api.get(`/api/cart/items/user/${userId}`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch cart',
      }
    }
  },

  /**
   * Update a cart item's participant count
   * @param {number} cartItemId - ID of the cart item
   * @param {number} userId - ID of the user (for authorization)
   * @param {number} numberOfParticipants - New number of participants
   * @returns {Promise} Response with updated cart item
   */
  async updateCartItem(cartItemId, userId, numberOfParticipants) {
    try {
      const response = await api.put(`/api/cart/items/${cartItemId}`, {
        userId,
        numberOfParticipants,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update cart item',
      }
    }
  },

  /**
   * Remove a cart item
   * @param {number} cartItemId - ID of the cart item to remove
   * @param {number} userId - ID of the user (for authorization)
   * @returns {Promise} Response
   */
  async removeCartItem(cartItemId, userId) {
    try {
      const response = await api.delete(`/api/cart/items/${cartItemId}?userId=${userId}`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to remove cart item',
      }
    }
  },

  /**
   * Clear all items from user's cart
   * @param {number} userId - ID of the user
   * @returns {Promise} Response
   */
  async clearCart(userId) {
    try {
      const response = await api.delete(`/api/cart/items/user/${userId}/clear`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to clear cart',
      }
    }
  },

  /**
   * Get the count of items in user's cart
   * @param {number} userId - ID of the user
   * @returns {Promise} Response with count
   */
  async getCartCount(userId) {
    try {
      const response = await api.get(`/api/cart/items/user/${userId}/count`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get cart count',
      }
    }
  },
}

export default cartService
