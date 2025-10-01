import React, { useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import LikeButton from '../reviews/LikeButton';

const MyReviewsTab = ({ touristReviews, loading }) => {
    const [sortOption, setSortOption] = useState('newest');

    // Sort reviews based on selected option
    const sortedReviews = useMemo(() => {
        if (!touristReviews || touristReviews.length === 0) return [];

        const sorted = [...touristReviews].sort((a, b) => {
            switch (sortOption) {
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'highest':
                    // Sort by rating first (highest to lowest), then by newest if same rating
                    if (b.rating !== a.rating) {
                        return b.rating - a.rating;
                    }
                    // If same rating, sort by newest
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return sorted;
    }, [touristReviews, sortOption]);

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
                    My reviews
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutrals-4">{touristReviews.length} reviews given</span>
                    <select
                        className="select-field-sm"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Rating</option>
                    </select>
                </div>
            </div>
            
            {touristReviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">No reviews yet</h3>
                    <p className="text-sm text-gray-500">Your reviews will appear here once you leave feedback on experiences.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedReviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-4">
                                <img
                                    src={review.avatar}
                                    alt={review.tourGuide}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-neutrals-1">Tour Guide: {review.tourGuide}</h4>
                                            <p className="text-xs text-neutrals-4">{review.tourName}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <p className="text-neutrals-3 text-sm mb-3">{review.comment}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-neutrals-4">{review.timeAgo}</span>
                                            <LikeButton
                                                reviewId={review.reviewId || review.id}
                                                initialLikeCount={review.likeCount || 0}
                                                className="text-xs"
                                            />
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
}

export default MyReviewsTab;