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
      console.warn('Authentication failed, token may be expired')
    }
    return Promise.reject(error)
  }
)

// User Survey Service
export const userSurveyService = {
  // Check if user has completed survey
  async checkUserSurveyExists(userId) {
    try {
      const response = await api.get(`/api/user-surveys/user/${userId}/exists`)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to check user survey'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        // User survey not found is a valid case
        return {
          success: true,
          data: { exists: false }
        }
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

  // Get user survey by user ID
  async getUserSurveyByUserId(userId) {
    try {
      const response = await api.get(`/api/user-surveys/user/${userId}`)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch user survey'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User survey not found'
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

  // Create user survey
  async createUserSurvey(surveyData) {
    try {
      console.log('Sending survey data:', surveyData)
      const response = await api.post('/api/user-surveys', surveyData)
      console.log('Survey creation response:', response.data)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.error('Survey creation error:', error)
      console.error('Error response data:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      let errorMessage = 'Failed to create user survey'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 400) {
        // Use the specific error message from backend
        errorMessage = error.response?.data || 'Invalid survey data'
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

  // Update user survey
  async updateUserSurvey(surveyId, surveyData) {
    try {
      console.log('Sending update request with:', { surveyId, surveyData });
      const response = await api.put(`/api/user-surveys/${surveyId}`, surveyData)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.error('Update survey error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Failed to update user survey'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required'
      } else if (error.response?.status === 404) {
        errorMessage = 'User survey not found'
      } else if (error.response?.status === 400) {
        // Try to get more specific error details
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error
          } else {
            errorMessage = `Invalid survey data: ${JSON.stringify(error.response.data)}`
          }
        } else {
          errorMessage = 'Invalid survey data - please check all required fields'
        }
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

export default userSurveyService