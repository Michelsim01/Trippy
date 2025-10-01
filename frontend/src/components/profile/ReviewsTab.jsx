import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../reviews/LikeButton';

const ReviewsTab = ({ reviews, loading, onSortChange }) => {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('newest');
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-primary-2 fill-current' : 'text-neutrals-5'}`} 
            />
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-neutrals-4">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-neutrals-1">
                    Reviews received
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutrals-4">{reviews.length} reviews</span>
                    <select
                        className="select-field-sm"
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            if (onSortChange) {
                                onSortChange(e.target.value);
                            }
                        }}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Rating</option>
                    </select>
                </div>
            </div>
            
            {reviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">No reviews yet</h3>
                    <p className="text-sm text-gray-500">Reviews will appear here once guests leave feedback.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.reviewId} className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                             onClick={() => navigate(`/experience/${review.experience?.experienceId}`)}>
                            <div className="flex items-start gap-4">
                                <img
                                    src={review.reviewer?.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'}
                                    alt={review.reviewer?.firstName || 'Anonymous'}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-neutrals-1">
                                                {review.reviewer ? `${review.reviewer.firstName} ${review.reviewer.lastName}` : 'Anonymous'}
                                            </h4>
                                            {review.experience && (
                                                <p className="text-xs text-neutrals-4">
                                                    Review for: <span className="font-medium text-primary-1">{review.experience.title}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    {review.title && (
                                        <h5 className="font-medium text-neutrals-1 mb-1">{review.title}</h5>
                                    )}
                                    <p className="text-neutrals-3 text-sm mb-3">{review.comment}</p>

                                    {/* Review Photos */}
                                    {review.photos && review.photos.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex gap-2 flex-wrap">
                                                {review.photos.slice(0, 3).map((photo, index) => (
                                                    <img
                                                        key={index}
                                                        src={photo.url}
                                                        alt={`Review photo ${index + 1}`}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ))}
                                                {review.photos.length > 3 && (
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <span className="text-xs text-gray-600">
                                                            +{review.photos.length - 3}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-neutrals-4">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <LikeButton
                                                    reviewId={review.reviewId}
                                                    initialLikeCount={review.likeCount || 0}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewsTab;
