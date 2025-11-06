import axios from 'axios'

// Base URL for backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for AI responses
})

// Request interceptor to add auth token and user ID to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (user.id) {
      config.headers['User-ID'] = user.id
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/')

      if (!isAuthEndpoint) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// Itinerary Chatbot Service
export const itineraryChatbotService = {
  // Send a message and get AI response
  async sendMessage(sessionId, message) {
    try {
      const response = await api.post('/api/itinerary-chatbot/message', {
        sessionId,
        message,
      })

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to send message'

      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.response) {
          // Return the error response from the chatbot
          return {
            success: true,
            data: error.response.data,
          }
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

  // Get conversation history for a session
  async getSessionHistory(sessionId) {
    try {
      const response = await api.get(`/api/itinerary-chatbot/sessions/${sessionId}`)

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to get session history'

      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Session not found',
          notFound: true,
        }
      }

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

  // Delete a chat session
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`/api/itinerary-chatbot/sessions/${sessionId}`)

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to delete session'

      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Session not found',
          notFound: true,
        }
      }

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

  // Get all sessions for a user
  async getUserSessions(userId) {
    try {
      const response = await api.get(`/api/itinerary-chatbot/users/${userId}/sessions`)

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to get user sessions'

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

  // Get conversation starters/suggestions
  async getSuggestions() {
    try {
      const response = await api.get('/api/itinerary-chatbot/suggestions')

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Failed to get suggestions'

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

  // Get health status of the chatbot service
  async getHealthStatus() {
    try {
      const response = await api.get('/api/itinerary-chatbot/health')

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      let errorMessage = 'Chatbot service is unavailable'

      if (error.response?.data) {
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
      }
    }
  },

  // Generate a new session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  },
}

export default itineraryChatbotService
