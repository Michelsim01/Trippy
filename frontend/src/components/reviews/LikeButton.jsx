import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';

const LikeButton = ({ reviewId, initialLikeCount = 0, className = '' }) => {
  const { user } = useAuth();
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  // Load initial like status
  useEffect(() => {
    if (reviewId && user?.id) {
      loadLikeStatus();
    }
  }, [reviewId, user?.id]);

  const loadLikeStatus = async () => {
    try {
      const result = await reviewService.getLikeStatus(reviewId, user.id);
      if (result.success) {
        setHasLiked(result.data.hasLiked);
        setLikeCount(result.data.likeCount);
      }
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      let result;
      if (hasLiked) {
        result = await reviewService.unlikeReview(reviewId, user.id);
      } else {
        result = await reviewService.likeReview(reviewId, user.id);
      }

      if (result.success) {
        setHasLiked(!hasLiked);
        setLikeCount(result.data.likeCount);
      } else {
        console.error('Failed to toggle like:', result.error);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // Show read-only like count for non-authenticated users
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${className}`}>
        <Heart className="w-4 h-4" />
        <span className="text-sm">{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleLikeToggle}
      disabled={loading}
      className={`flex items-center gap-1 transition-colors duration-200 ${
        hasLiked
          ? 'text-red-500 hover:text-red-400'
          : 'text-gray-500 hover:text-red-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          hasLiked ? 'fill-current' : ''
        }`}
      />
      <span className="text-sm">{likeCount}</span>
    </button>
  );
};

export default LikeButton;