import React, { useState } from 'react';
import { MessageCircle, Flag, MoreVertical } from 'lucide-react';
import StarRating from './StarRating';
import LikeButton from './LikeButton';
import { useAuth } from '../../contexts/AuthContext';

const ReviewCard = ({
  review,
  showExperience = false,
  onReport = null,
  className = ''
}) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const isOwnReview = user?.id === review.reviewer?.id;
  const reviewerName = review.reviewer ?
    `${review.reviewer.firstName} ${review.reviewer.lastName}` :
    'Anonymous User';

  const reviewerAvatar = review.reviewer?.profileImageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=random`;

  // Debug photos data
  React.useEffect(() => {
    if (review.photos) {
      console.log('Review photos data for review', review.reviewId, ':', review.photos);
    }
  }, [review.photos, review.reviewId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const handleReport = () => {
    if (onReport) {
      onReport(review.reviewId, review);
    }
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={reviewerAvatar}
            alt={reviewerName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=random`;
            }}
          />
          <div>
            <h4 className="font-semibold text-gray-900">{reviewerName}</h4>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StarRating rating={review.rating} size="sm" />

          {/* Actions Menu - Only show for others' reviews (Report option) */}
          {!isOwnReview && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Review actions"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleReport();
                        setShowActions(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report review</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Experience Info (if showing experience) */}
      {showExperience && review.experience && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            Review for: {review.experience.title}
          </p>
          <p className="text-xs text-gray-500">
            {review.experience.location}
          </p>
        </div>
      )}

      {/* Review Title */}
      {review.title && (
        <h5 className="font-semibold text-gray-900 mb-2">
          {review.title}
        </h5>
      )}

      {/* Review Content */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {review.comment}
        </p>
      </div>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {review.photos.slice(0, 6).map((photo, index) => (
              <div key={index} className="aspect-square">
                <img
                  src={photo.url}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {index === 5 && review.photos.length > 6 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">
                      +{review.photos.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <LikeButton
            reviewId={review.reviewId}
            initialLikeCount={review.likeCount || 0}
            className="text-sm"
          />
        </div>
      </div>

      {/* Click outside to close actions menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}

    </div>
  );
};

export default ReviewCard;