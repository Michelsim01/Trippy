import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Target, Gift, Plus, Minus, Calendar, TrendingUp } from 'lucide-react';
import tripPointsService from '../../services/tripPointsService';

const TripPointsHistory = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactionHistory();
  }, [userId]);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await tripPointsService.getTransactionHistory(userId);
      if (response.success) {
        setTransactions(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load transaction history');
      console.error('Error fetching transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (transactionType) => {
    switch (transactionType) {
      case 'REVIEW':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'EXPERIENCE_COMPLETION':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'REDEMPTION':
        return <Gift className="w-5 h-5 text-red-500" />;
      case 'BONUS':
        return <Plus className="w-5 h-5 text-green-500" />;
      case 'REFUND':
        return <Minus className="w-5 h-5 text-purple-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionDescription = (transaction) => {
    // Always use transaction type descriptions from enum
    switch (transaction.transactionType) {
      case 'REVIEW':
        return 'Left a review';
      case 'EXPERIENCE_COMPLETION':
        return 'Completed experience';
      case 'REDEMPTION':
        return 'Redeemed points';
      case 'BONUS':
        return 'Bonus points';
      case 'REFUND':
        return 'Points refunded';
      default:
        return 'TripPoints transaction';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPointsChange = (pointsChange) => {
    if (pointsChange > 0) {
      return `+${pointsChange}`;
    }
    return pointsChange.toString();
  };

  const getPointsChangeColor = (pointsChange) => {
    if (pointsChange > 0) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={fetchTransactionHistory}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Points History
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
            <p className="text-gray-500">
              Start earning TripPoints by completing experiences and leaving reviews!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div 
                key={transaction.pointsId} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.transactionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getTransactionDescription(transaction)}
                      {transaction.transactionType === 'REVIEW' && transaction.experience?.title && (
                        <>
                          <span className="text-neutrals-4"> · </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/experience/${transaction.experience.experienceId}`);
                            }}
                            className="text-primary-1 hover:underline"
                          >
                            {transaction.experience.title}
                          </button>
                        </>
                      )}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getPointsChangeColor(transaction.pointsChange)}`}>
                      {formatPointsChange(transaction.pointsChange)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {transaction.pointsBalanceAfter}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPointsHistory;
