import React from 'react';
import { Star } from 'lucide-react';

const MyReviewsTab = ({ touristReviews }) => {
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
                    My reviews
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutrals-4">{touristReviews.length} reviews given</span>
                    <select className="select-field-sm">
                        <option>Newest</option>
                        <option>Oldest</option>
                        <option>Highest Rating</option>
                    </select>
                </div>
            </div>
            
            <div className="space-y-4">
                {touristReviews.map((review) => (
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
                                    <span className="text-xs text-neutrals-4">{review.timeAgo}</span>
                                    <div className="flex items-center gap-2">
                                        <button className="btn btn-outline-info btn-sm">
                                            Edit
                                        </button>
                                        <button className="btn btn-outline-accent btn-sm">
                                            Delete
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

export default MyReviewsTab;
