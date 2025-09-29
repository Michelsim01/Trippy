import React, { useState } from 'react';
import { MessageCircle, Flag, MoreVertical, Edit, Trash2 } from 'lucide-react';
import StarRating from './StarRating';
import ReviewDeleteModal from './ReviewDeleteModal';
import LikeButton from './LikeButton';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewContext';

const ReviewCard = ({
  review,
  showExperience = false,
  onEdit = null,
  onDelete = null,
  onReport = null,
  className = ''
}) => {
  const { user } = useAuth();
  const { deleteReview, loading: reviewsLoading } = useReviews();
  const [showActions, setShowActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnReview = user?.id === review.reviewer?.id;
  const reviewerName = review.reviewer ?
    `${review.reviewer.firstName} ${review.reviewer.lastName}` :
    'Anonymous User';

  const reviewerAvatar = review.reviewer?.profileImageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=random`;

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

  const handleDeleteClick = () => {
    setShowActions(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (reviewId) => {
    setIsDeleting(true);
    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        setShowDeleteModal(false);
        // Call parent callback if provided
        if (onDelete) {
          onDelete(reviewId, review);
        }
      } else {
        // Handle error - could show a toast notification
        console.error('Failed to delete review:', result.error);
        alert('Failed to delete review. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
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

          {/* Actions Menu */}
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
                  {isOwnReview && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(review);
                        setShowActions(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit review</span>
                    </button>
                  )}

                  {isOwnReview && (
                    <button
                      onClick={handleDeleteClick}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete review</span>
                    </button>
                  )}

                  {!isOwnReview && (
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
                  )}
                </div>
              </div>
            )}
          </div>
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

      {/* TripPoints Earned */}
      {review.tripPointsEarned && review.tripPointsEarned > 0 && (
        <div className="mb-4 inline-flex items-center px-2 py-1 bg-blue-50 rounded-full">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-xs font-medium text-blue-700">
            Earned {review.tripPointsEarned} TripPoints
          </span>
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

          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span>Reply</span>
          </button>
        </div>

        <div className="text-xs text-gray-400">
          {review.updatedAt !== review.createdAt && (
            <span>Edited</span>
          )}
        </div>
      </div>

      {/* Click outside to close actions menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ReviewDeleteModal
        isOpen={showDeleteModal}
        review={review}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ReviewCard;