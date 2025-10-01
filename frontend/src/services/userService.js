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
      console.warn('Authentication failed, token may be expired')
    }
    return Promise.reject(error)
  }
)

// User Service
export const userService = {
  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/api/users/${userId}`)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch user data'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
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
        status: error.response?.status
      }
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const response = await api.get(`/api/users/${userId}/stats`)

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch user statistics'

      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
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
        status: error.response?.status
      }
    }
  },

  // Get guide statistics (for tour guides)
  async getGuideStats(userId) {
    try {
      const response = await api.get(`/api/users/${userId}/guide-stats`)

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch guide statistics'

      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
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
        status: error.response?.status
      }
    }
  },

  // Update user details
  async updateUserDetails(userId, updates) {
    try {
      const response = await api.put(`/api/users/${userId}/details`, updates)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to update user details'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      }
    }
  },

  // Change user password
  async changePassword(userId, newPassword) {
    try {
      const response = await api.put(`/api/users/${userId}/changePassword`, {
        newPassword
      })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to change password'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      }
    }
  },

  // Verify password
  async verifyPassword(userId, password) {
    try {
      const response = await api.post(`/api/users/${userId}/verifyPassword`, {
        password
      })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to verify password'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      }
    }
  },

  // Upload profile picture
  async uploadProfilePicture(userId, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post(`/api/users/${userId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to upload profile picture'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found'
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      }
    }
  },

  // Get all users (admin only)
  async getAllUsers() {
    try {
      const response = await api.get('/api/users')
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch users'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied'
      } else if (error.response?.data) {
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
        status: error.response?.status
      }
    }
  }
}

export default userService
