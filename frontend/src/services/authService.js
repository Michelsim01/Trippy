import axios from 'axios'

// this file handles all the authentication related requests (API calls) to the backend
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
      // Only redirect if it's not a login/register request
      // This prevents automatic redirect on login failures
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || 
                            error.config?.url?.includes('/api/auth/register')
      
      if (!isAuthEndpoint) {
        // Token expired or invalid for protected routes
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/'
      }
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
      let errorType = 'GENERAL_ERROR'
      
      if (error.response?.data) {
        // Check for account suspension error
        if (error.response.status === 403 && error.response.data.error === 'ACCOUNT_SUSPENDED') {
          errorType = 'ACCOUNT_SUSPENDED'
          errorMessage = error.response.data.message || 'Your account has been suspended. Please contact support to appeal.'
        } else if (typeof error.response.data === 'string') {
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
        errorType: errorType,
      }
    }
  },

  // Register new user
  async register(userData) {
    try {
      console.log('authService register: calling API')
      const response = await api.post('/api/auth/register', userData)
      console.log('authService register: API call successful')
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.log('authService register: caught error', error)
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
      
      console.log('authService register: returning error', errorMessage)
      
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

  // Forgot password - request password reset
  async forgotPassword(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      
      return {
        success: true,
        data: response.data,
      } 
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Failed to send reset instructions'
      
      if (error.response?.data) {
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

  // Validate reset token
  async validateResetToken(token) {
    try {
      const response = await api.get(`/api/auth/validate-reset-token?token=${token}`)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Invalid or expired token',
      }
    }
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        newPassword,
      })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Failed to reset password'
      
      if (error.response?.data) {
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

  // Email Verification Methods

  // Send verification email to user
  async sendVerificationEmail(email) {
    try {
      const response = await api.post('/api/email-verification/send-verification', { email })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Failed to send verification email'
      
      if (error.response?.data) {
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

  // Verify email with token
  async verifyEmail(token) {
    try {
      const response = await api.post('/api/email-verification/verify-email', { token })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Email verification failed'
      
      if (error.response?.data) {
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

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const response = await api.post('/api/email-verification/resend-verification', { email })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Failed to resend verification email'
      
      if (error.response?.data) {
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

  // Check if email is verified
  async checkEmailVerification(email) {
    try {
      const response = await api.get(`/api/email-verification/check-verification?email=${encodeURIComponent(email)}`)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Failed to check verification status'
      
      if (error.response?.data) {
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

}

export default authService
