import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ExperienceCard = ({ 
    experience,
    showWishlistButton = true,
    onWishlistToggle = null,
    variant = 'default',
    showExplore = false
}) => {
    const [isWishlisted, setIsWishlisted] = useState(true); // Default to true for demo
    const navigate = useNavigate();

    const handleWishlistToggle = (e) => {
        e.stopPropagation(); // Prevent card click when clicking wishlist button
        setIsWishlisted(!isWishlisted);
        if (onWishlistToggle) {
            onWishlistToggle(experience?.experienceId || experience?.id, !isWishlisted);
        }
    };

    const handleCardClick = () => {
        const experienceId = experience?.experienceId || experience?.id || 1;
        navigate(`/experience/${experienceId}`);
    };

    // Use experience data if provided, otherwise use dummy data
    const cardData = experience || {
        id: 1,
        experienceId: 1,
        title: "Venice, Rome & Milan",
        location: "Karineside",
        price: 548,
        originalPrice: 699,
        dateRange: "Tue, Jul 20 - Fri, Jul 23",
        rating: 4.9,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    };

    // Format price to show as currency
    const formatPrice = (price) => {
        return typeof price === 'number' ? Math.round(price) : price;
    };

    return (
        <div 
            className="flex flex-col h-[365px] w-64 shrink-0 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={handleCardClick}
        >
            {/* Image Container */}
            <div className="relative flex-1 bg-neutrals-2 rounded-t-[16px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${cardData.imageUrl || cardData.image})` }}
                />
                
                {/* Explore Button - shows on some cards */}
                {showExplore && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button 
                            className="btn-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick();
                            }}
                        >
                            Explore
                        </button>
                    </div>
                )}
                
                {/* Wishlist Heart Button */}
                {showWishlistButton && (
                    <button 
                        onClick={handleWishlistToggle}
                        className="btn-icon absolute top-4 right-4"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={isWishlisted ? "#FD7FE9" : "#E5E7EB"} />
                        </svg>
                    </button>
                )}
            </div>

            {/* Card Info */}
            <div className="bg-white p-5 rounded-b-[16px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-[16px] font-medium text-neutrals-1 leading-[24px] mb-2">
                            {cardData.title}
                        </h3>
                        <div className="flex items-start justify-between">
                            <p className="text-[12px] text-neutrals-3 leading-[20px] flex-1">
                                {cardData.location}
                            </p>
                            <div className="flex items-center gap-1.5">
                                {cardData.originalPrice && cardData.originalPrice > cardData.price && (
                                    <span className="text-[12px] font-bold text-neutrals-5 line-through">
                                        ${formatPrice(cardData.originalPrice)}
                                    </span>
                                )}
                                <span className="text-[12px] font-bold text-primary-1 uppercase">
                                    ${formatPrice(cardData.price)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutrals-6 rounded-[1px]" />

                {/* Date and Rating */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-1 text-[12px] text-neutrals-4 leading-[20px]">
                        {cardData.dateRange ? (
                            <>
                                <span>{cardData.dateRange.split(' - ')[0]}</span>
                                <span>-</span>
                                <span>{cardData.dateRange.split(' - ')[1]}</span>
                            </>
                        ) : (
                            <>
                                <span>Tue, Jul 20</span>
                                <span>-</span>
                                <span>Fri, Jul 23</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                        </svg>
                        <span className="text-[12px] font-semibold text-neutrals-1">
                            {cardData.rating || cardData.averageRating || 4.9}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExperienceCard;