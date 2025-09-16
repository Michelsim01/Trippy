import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext';

const ExperienceCard = ({ 
    experience,
    showWishlistButton = true,
    onWishlistToggle = null,
    variant = 'default',
    showExplore = false,
    showEditButton = false ,
    isInWishlist = false, // New prop to indicate if this item is in the user's wishlist
    schedules = [] // New prop for schedule data
}) => {
    const { user } = useAuth();
    const [isWishlisted, setIsWishlisted] = useState(isInWishlist); // Initialize based on prop
    const navigate = useNavigate();

    // Sync local state with prop changes
    useEffect(() => {
        setIsWishlisted(isInWishlist);
    }, [isInWishlist]);


    const handleWishlistToggle = async (e) => {
        e.stopPropagation(); // Prevent card click when clicking wishlist button
        
        const newWishlistState = !isWishlisted;
        setIsWishlisted(newWishlistState); // Update local state immediately for UI feedback
        
        try {
            const experienceId = experience?.experienceId || experience?.id;
            const userId = user?.id || user?.userId;
            
            console.log('ExperienceCard - Wishlist toggle:', {
                experienceId,
                userId,
                user,
                newWishlistState
            });
            
            if (!userId) {
                console.error('ExperienceCard - No user ID available for wishlist operation');
                setIsWishlisted(!newWishlistState); // Revert state
                return;
            }
            
            if (newWishlistState) {
                // Add to wishlist
                const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${userId}/experience/${experienceId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                
                if (!response.ok) {
                    // Revert state if API call failed
                    setIsWishlisted(!newWishlistState);
                    console.error('Failed to add to wishlist');
                }
            } else {
                // Remove from wishlist
                const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${userId}/experience/${experienceId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                
                if (!response.ok) {
                    // Revert state if API call failed
                    setIsWishlisted(!newWishlistState);
                    console.error('Failed to remove from wishlist');
                }
            }
            
            // Call the parent callback if provided
            if (onWishlistToggle) {
                onWishlistToggle(experienceId, newWishlistState);
            }
            
        } catch (error) {
            // Revert state if API call failed
            setIsWishlisted(!newWishlistState);
            console.error('Error toggling wishlist:', error);
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
        duration: 3,
        category: "GUIDED_TOUR",
        participantsAllowed: 12,
        rating: 4.9,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    };

    // Format price to show as currency
    const formatPrice = (price) => {
        if (typeof price === 'number' && price > 0) {
            return Math.round(price);
        }
        if (typeof price === 'string' && !isNaN(parseFloat(price))) {
            return Math.round(parseFloat(price));
        }
        return '99'; // Default fallback price
    };

    return (
            <div
                className="flex flex-col w-64 shrink-0 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white rounded-[16px] border border-neutrals-6 overflow-hidden"
                onClick={handleCardClick}
            >
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] bg-neutrals-2 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ 
                            backgroundImage: `url(${cardData.coverPhotoUrl || cardData.imageUrl || cardData.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                {/* Edit Button (only if showEditButton) */}
                {showEditButton && (
                    <Edit
                        size={20}
                        className="absolute top-4 left-4 z-20 bg-white hover:bg-white rounded-full p-1 shadow"
                        onClick={e => {
                            e.stopPropagation();
                            const experienceId = experience?.experienceId || experience?.id;
                            navigate(`/edit-experience/${experienceId}`);
                        }}
                        title="Edit Experience"
                    >
                    </Edit>
                )}
                
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
                        className={`absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isWishlisted ? 'animate-pulse' : ''}`}
                    >
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-all duration-300 ${isWishlisted ? 'scale-110' : 'scale-100'}`}
                        >
                            <path 
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                                fill={isWishlisted ? "#FD7FE9" : "#B1B5C3"}
                                className="transition-colors duration-300"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Card Info */}
            <div className="bg-white p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-[16px] font-medium text-neutrals-1 leading-[24px] mb-2">
                            {cardData.title}
                        </h3>
                        <div className="flex items-start justify-between">
                            <p className="text-[12px] text-neutrals-3 leading-[20px] flex-1">
                                {cardData.location}
                            </p>
                            <span className="text-[12px] font-bold text-primary-1 uppercase">
                                ${formatPrice(cardData.price)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutrals-6 rounded-[1px]" />

                {/* Duration, Participants and Rating */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 text-[12px] text-neutrals-4 leading-[20px]">
                        <div className="flex items-center gap-1">
                            <span style={{ filter: 'grayscale(1)', opacity: 0.7 }}>🕐</span>
                            <span>{cardData.duration || 3}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span style={{ filter: 'grayscale(1)', opacity: 0.7 }}>👤</span>
                            <span>
                                {(() => {
                                    // Show total participants from schedules if available
                                    if (schedules && schedules.length > 0) {
                                        const totalSpots = schedules.reduce((sum, schedule) => sum + (schedule.availableSpots || 0), 0);
                                        return totalSpots;
                                    }
                                    // Show participantsAllowed if available
                                    else if (cardData.participantsAllowed) {
                                        return cardData.participantsAllowed;
                                    }
                                    // Default fallback
                                    else {
                                        return 40;
                                    }
                                })()}
                            </span>
                        </div>
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