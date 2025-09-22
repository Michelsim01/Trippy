import React, { useState, useEffect } from 'react'
import { useTripPoints } from '../../contexts/TripPointsContext'

const TripPointsHistory = ({ userId, className = '' }) => {
  const { tripPoints, loading, error } = useTripPoints()
  const [history, setHistory] = useState([])

  useEffect(() => {
    // For now, we'll create mock history data
    // In a real implementation, this would come from the backend
    const mockHistory = [
      {
        id: 1,
        type: 'review',
        description: 'Left a review for Venice Canal Tour',
        points: 50,
        date: new Date('2024-01-15'),
        experienceName: 'Venice Canal Tour'
      },
      {
        id: 2,
        type: 'experience',
        description: 'Completed Florence Art Tour',
        points: 25,
        date: new Date('2024-01-10'),
        experienceName: 'Florence Art Tour'
      },
      {
        id: 3,
        type: 'review',
        description: 'Left a review for Rome Colosseum Tour',
        points: 50,
        date: new Date('2024-01-05'),
        experienceName: 'Rome Colosseum Tour'
      },
      {
        id: 4,
        type: 'redemption',
        description: 'Redeemed points for discount',
        points: -100,
        date: new Date('2024-01-01'),
        experienceName: 'Booking Discount'
      }
    ]
    setHistory(mockHistory)
  }, [tripPoints])

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'review':
        return '⭐'
      case 'experience':
        return '🎯'
      case 'redemption':
        return '🎁'
      default:
        return '📝'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'review':
        return 'text-blue-600'
      case 'experience':
        return 'text-green-600'
      case 'redemption':
        return 'text-orange-600'
      default:
        return 'text-neutrals-3'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-neutrals-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-neutrals-6 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-neutrals-6 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutrals-6 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-neutrals-6 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-neutrals-6 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-red-200 ${className}`}>
        <div className="text-red-500 text-sm">
          <p className="font-medium mb-2">Error loading history</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-neutrals-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutrals-1">Points History</h3>
        <div className="text-sm text-neutrals-3">
          {history.length} transactions
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-neutrals-3 text-sm">No points history yet</p>
          <p className="text-neutrals-4 text-xs mt-1">
            Start earning points by completing experiences and leaving reviews!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutrals-8 transition-colors">
              <div className="text-2xl">
                {getTypeIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-neutrals-1 truncate">
                  {item.description}
                </div>
                <div className="text-xs text-neutrals-3 truncate">
                  {item.experienceName}
                </div>
                <div className="text-xs text-neutrals-4">
                  {formatDate(item.date)}
                </div>
              </div>
              
              <div className={`text-sm font-semibold ${getTypeColor(item.type)}`}>
                {item.points > 0 ? '+' : ''}{item.points}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutrals-6">
          <button className="text-sm text-primary-1 hover:text-primary-2 transition-colors">
            View all transactions →
          </button>
        </div>
      )}
    </div>
  )
}

export default TripPointsHistory
