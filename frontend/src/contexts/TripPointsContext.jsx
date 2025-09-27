import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { tripPointsService } from '../services/tripPointsService'

const TripPointsContext = createContext()

export const useTripPoints = () => {
  const context = useContext(TripPointsContext)
  if (!context) {
    throw new Error('useTripPoints must be used within a TripPointsProvider')
  }
  return context
}

export const TripPointsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [pointsBalance, setPointsBalance] = useState({
    pointsBalance: 0,
    totalEarned: 0,
    totalRedeemed: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch points balance for the current user
  const fetchPointsBalance = async (userId) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const response = await tripPointsService.getUserPointsBalance(userId)
      
      if (response.success) {
        setPointsBalance(response.data)
      } else {
        setError(response.error)
      }
    } catch (err) {
      console.error('Error fetching points balance:', err)
      setError('Failed to fetch points balance')
    } finally {
      setLoading(false)
    }
  }

  // Award points for review
  const awardPointsForReview = async (referenceId = null) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' }

    try {
      const response = await tripPointsService.awardPointsForReview(user.id, referenceId)
      
      if (response.success) {
        // Refresh the points balance after awarding
        await fetchPointsBalance(user.id)
        return response
      } else {
        return response
      }
    } catch (err) {
      console.error('Error awarding points for review:', err)
      return { success: false, error: 'Failed to award points for review' }
    }
  }

  // Award points for experience completion
  const awardPointsForExperience = async (referenceId = null) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' }

    try {
      const response = await tripPointsService.awardPointsForExperience(user.id, referenceId)
      
      if (response.success) {
        // Refresh the points balance after awarding
        await fetchPointsBalance(user.id)
        return response
      } else {
        return response
      }
    } catch (err) {
      console.error('Error awarding points for experience:', err)
      return { success: false, error: 'Failed to award points for experience' }
    }
  }

  // Redeem points
  const redeemPoints = async (pointsToRedeem) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' }

    try {
      const response = await tripPointsService.redeemPoints(user.id, pointsToRedeem)
      
      if (response.success) {
        // Refresh the points balance after redemption
        await fetchPointsBalance(user.id)
        return response
      } else {
        return response
      }
    } catch (err) {
      console.error('Error redeeming points:', err)
      return { success: false, error: 'Failed to redeem points' }
    }
  }

  // Get leaderboard
  const getLeaderboard = async () => {
    try {
      const response = await tripPointsService.getLeaderboard()
      return response
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      return { success: false, error: 'Failed to fetch leaderboard' }
    }
  }

  // Get points policy
  const getPointsPolicy = async () => {
    try {
      const response = await tripPointsService.getPointsPolicy()
      return response
    } catch (err) {
      console.error('Error fetching points policy:', err)
      return { success: false, error: 'Failed to fetch points policy' }
    }
  }

  // Get transaction history
  const getTransactionHistory = async (userId) => {
    try {
      const response = await tripPointsService.getTransactionHistory(userId)
      return response
    } catch (err) {
      console.error('Error fetching transaction history:', err)
      return { success: false, error: 'Failed to fetch transaction history' }
    }
  }

  // Refresh all TripPoints data
  const refreshTripPoints = async () => {
    if (user?.id) {
      await fetchPointsBalance(user.id)
    }
  }

  // Effect to fetch TripPoints data when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchPointsBalance(user.id)
    } else {
      // Clear data when user logs out
      setPointsBalance({
        pointsBalance: 0,
        totalEarned: 0,
        totalRedeemed: 0
      })
      setError(null)
    }
  }, [isAuthenticated, user?.id])

  const value = {
    // State
    pointsBalance,
    loading,
    error,
    
    // Actions
    fetchPointsBalance,
    awardPointsForReview,
    awardPointsForExperience,
    redeemPoints,
    getLeaderboard,
    getPointsPolicy,
    getTransactionHistory,
    refreshTripPoints,
    
    // Computed values
    currentBalance: pointsBalance.pointsBalance || 0,
    totalEarned: pointsBalance.totalEarned || 0,
    totalRedeemed: pointsBalance.totalRedeemed || 0,
    hasPoints: (pointsBalance.pointsBalance || 0) > 0
  }

  return (
    <TripPointsContext.Provider value={value}>
      {children}
    </TripPointsContext.Provider>
  )
}

export default TripPointsContext
