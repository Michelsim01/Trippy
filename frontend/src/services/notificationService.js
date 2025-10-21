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

export const notificationService = {
  // Get all notifications for a user
  async getUserNotifications(userId) {
    try {
      const response = await api.get(`/api/notifications/users/${userId}`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch notifications',
      }
    }
  },

  // Get unread notification count for a user
  async getUnreadCount(userId) {
    try {
      const response = await api.get(`/api/notifications/users/${userId}`)
      const notifications = response.data
      const unreadCount = notifications.filter(notification => !notification.isRead).length
      
      return {
        success: true,
        data: unreadCount,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch notification count',
      }
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      // Use the dedicated PATCH endpoint for marking as read
      const response = await api.patch(`/api/notifications/${notificationId}/read`)
      
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to mark notification as read',
      }
    }
  },

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await api.delete(`/api/notifications/${notificationId}`)
      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete notification',
      }
    }
  },

  // Create notification (for testing purposes)
  async createNotification(notificationData) {
    try {
      const token = localStorage.getItem('token');
      console.log('NotificationService: Auth token available:', !!token);
      console.log('NotificationService: Token length:', token?.length || 0);
      console.log('NotificationService: Sending POST request to /api/notifications with data:', notificationData);
      
      const response = await api.post('/api/notifications', notificationData)
      console.log('NotificationService: Received response:', response.status, response.data);
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.error('NotificationService: Error occurred:', error);
      console.error('NotificationService: Error response:', error.response?.data);
      console.error('NotificationService: Error status:', error.response?.status);
      console.error('NotificationService: Request config:', error.config);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message || 'Failed to create notification',
      }
    }
  }
}
