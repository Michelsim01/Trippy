import React from 'react';
import StarRating from './StarRating';

const ReviewStats = ({
  stats,
  totalReviews = 0,
  averageRating = 0,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
              <div className="flex-1 h-2 bg-gray-200 rounded"></div>
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalReviews === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-2">
          <StarRating rating={0} size="lg" />
        </div>
        <p className="text-gray-600 font-semibold">No reviews yet</p>
        <p className="text-sm text-gray-500">Be the first to share your experience!</p>
      </div>
    );
  }

  const ratingBreakdown = stats?.ratingDistribution || {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  const getRatingPercentage = (count) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  const formatRating = (rating) => {
    return parseFloat(rating).toFixed(1);
  };

  return (
    <div className={`bg-white rounded-lg p-6 border border-gray-200 ${className}`}>
      {/* Overall Rating */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {formatRating(averageRating)}
          </div>
          <StarRating rating={averageRating} size="lg" />
        </div>

        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900">
            {averageRating >= 4.5 ? 'Excellent' :
             averageRating >= 4.0 ? 'Very Good' :
             averageRating >= 3.0 ? 'Good' :
             averageRating >= 2.0 ? 'Fair' : 'Poor'}
          </p>
          <p className="text-sm text-gray-500">
            Based on {totalReviews.toLocaleString()} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingBreakdown[rating] || 0;
          const percentage = getRatingPercentage(count);

          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-12">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                <StarRating rating={1} size="sm" />
              </div>

              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="w-12 text-right">
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      {stats?.additionalStats && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {stats.additionalStats.recommendationRate && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.additionalStats.recommendationRate}%
                </div>
                <div className="text-gray-500">Would recommend</div>
              </div>
            )}

            {stats.additionalStats.responseRate && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.additionalStats.responseRate}%
                </div>
                <div className="text-gray-500">Host response rate</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keywords/Tags */}
      {stats?.popularKeywords && stats.popularKeywords.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            What guests loved most
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.popularKeywords.slice(0, 6).map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {keyword.word}
                <span className="ml-1 text-blue-600">({keyword.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewStats;