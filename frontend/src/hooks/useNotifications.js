import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { notificationService } from '../services/notificationService'

export const useNotifications = (refreshInterval = 30000) => { // Default refresh every 30 seconds
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await notificationService.getUserNotifications(user.id)
      
      if (response.success) {
        const sortedNotifications = response.data.sort((a, b) => {
          // Sort by read status (unread first), then by date (newest first)
          if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1
          }
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        
        setNotifications(sortedNotifications)
        setUnreadCount(sortedNotifications.filter(n => !n.isRead).length)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  // Fetch unread count only (lighter operation)
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0)
      return
    }

    try {
      const response = await notificationService.getUnreadCount(user.id)
      
      if (response.success) {
        setUnreadCount(response.data)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [isAuthenticated, user?.id])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId)
      
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification =>
            notification.notificationId === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        )
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      return response
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return { success: false, error: 'Failed to mark as read' }
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId)
      
      if (response.success) {
        // Update local state
        const wasUnread = notifications.find(n => n.notificationId === notificationId)?.isRead === false
        
        setNotifications(prev => 
          prev.filter(notification => notification.notificationId !== notificationId)
        )
        
        // Update unread count if the deleted notification was unread
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
      
      return response
    } catch (err) {
      console.error('Error deleting notification:', err)
      return { success: false, error: 'Failed to delete notification' }
    }
  }, [notifications])

  // Initial fetch when component mounts or auth state changes
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Set up automatic refresh for unread count
  useEffect(() => {
    if (!isAuthenticated || !user?.id || refreshInterval <= 0) {
      return
    }

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchUnreadCount, refreshInterval, isAuthenticated, user?.id])

  // Categorize notifications (same logic as NotificationsPage)
  const categorizedNotifications = {
    user: notifications.filter(n => n.type === 'PASSWORD_RESET' || n.type === 'UPDATE_INFO'),
    tours: notifications.filter(n => n.type === 'BOOKING_CONFIRMATION' || n.type === 'REMINDER' || n.type === 'DISCOUNT' || n.type === 'BOOKING_CANCELLED'),
    reviews: notifications.filter(n => n.type === 'REVIEW_REQUEST'),
    messages: notifications.filter(n => n.type === 'MESSAGE')
  }

  // Get unread count by category
  const getUnreadCountByCategory = (category) => {
    return categorizedNotifications[category]?.filter(n => !n.isRead).length || 0
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    categorizedNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
    getUnreadCountByCategory
  }
}
