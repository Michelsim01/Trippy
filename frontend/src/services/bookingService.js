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

export const bookingService = {
  // Get participants for a specific schedule
  async getScheduleParticipants(scheduleId) {
    try {
      const response = await api.get(`/api/bookings/schedule/${scheduleId}/participants`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch schedule participants',
      }
    }
  },

  // Cancel schedule by guide
  async cancelScheduleByGuide(scheduleId, reason) {
    try {
      const response = await api.post(`/api/bookings/experiences/schedules/${scheduleId}/cancel`, null, {
        params: { reason }
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to cancel schedule',
      }
    }
  }
}