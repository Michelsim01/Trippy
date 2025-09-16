import React from 'react';
import { Star } from 'lucide-react';

const ReviewsTab = ({ reviews }) => {
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-primary-2 fill-current' : 'text-neutrals-5'}`} 
            />
        ));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-neutrals-1">
                    Reviews received
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutrals-4">{reviews.length} reviews</span>
                    <select className="select-field-sm">
                        <option>Newest</option>
                        <option>Oldest</option>
                        <option>Highest Rating</option>
                    </select>
                </div>
            </div>
            
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-4">
                            <img 
                                src={review.avatar} 
                                alt={review.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-neutrals-1">{review.name}</h4>
                                    <div className="flex items-center gap-1">
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                                <p className="text-neutrals-3 text-sm mb-3">{review.comment}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutrals-4">{review.timeAgo}</span>
                                    <div className="flex items-center gap-2">
                                        <button className="btn btn-ghost btn-sm">
                                            Like
                                        </button>
                                        <button className="btn btn-ghost btn-sm">
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsTab;
