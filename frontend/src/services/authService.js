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
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Authentication Service
export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Login failed'
      
      if (error.response?.data) {
        // Backend returns error as plain string in response body
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Registration failed'
      
      if (error.response?.data) {
        // Backend returns error as plain string in response body
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/api/auth/logout')
      
      return {
        success: true,
      }
    } catch (error) {
      // Even if logout fails on backend, we should clear local data
      return {
        success: true, // Consider it successful for local cleanup
      }
    }
  },

  // Get current user data
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me')
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get user data',
      }
    }
  },

  // Refresh token (if your backend supports it)
  async refreshToken() {
    try {
      const response = await api.post('/api/auth/refresh')
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Token refresh failed',
      }
    }
  },

  // Verify token validity
  async verifyToken() {
    try {
      const response = await api.get('/api/auth/verify')
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Token verification failed',
      }
    }
  },
}

export default authService
