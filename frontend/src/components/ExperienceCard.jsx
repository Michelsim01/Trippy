import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext';
import { experienceApi } from '../services/experienceApi';

const ExperienceCard = ({
    experience,
    showWishlistButton = true,
    onWishlistToggle = null,
    variant = 'default',
    showExplore = false,
    showEditButton = false,
    showDeleteButton = false, // New prop to show delete button
    onExperienceDeleted = null, // Callback when experience is deleted
    isInWishlist = false, // New prop to indicate if this item is in the user's wishlist
    schedules = [] // New prop for schedule data
}) => {
    const { user } = useAuth();
    const [isWishlisted, setIsWishlisted] = useState(isInWishlist); // Initialize based on prop
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleDeleteClick = async (e) => {
        e.stopPropagation();

        // Simple browser confirmation
        const confirmed = window.confirm(`Are you sure you want to delete "${cardData.title}"? This action cannot be undone.`);
        if (!confirmed) return;

        setIsDeleting(true);

        try {
            const experienceId = experience?.experienceId || experience?.id;
            await experienceApi.deleteExperience(experienceId);

            // Call the parent callback if provided
            if (onExperienceDeleted) {
                onExperienceDeleted(experienceId);
            }

            // Success
        } catch (error) {
            console.error('Error deleting experience:', error);
            // Show simple popup for errors
            alert(error.message || 'An error occurred while deleting the experience');
        } finally {
            setIsDeleting(false);
        }
    };


    // Use experience data directly
    const cardData = experience;

    // Format price to show as currency
    const formatPrice = (price) => {
        if (typeof price === 'number' && price > 0) {
            return Math.round(price);
        }
        if (typeof price === 'string' && !isNaN(parseFloat(price))) {
            return Math.round(parseFloat(price));
        }
        return '0';
    };

    return (
            <div
                className="relative flex flex-col w-64 shrink-0 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white rounded-[16px] border border-neutrals-6 overflow-hidden"
                onClick={handleCardClick}
            >
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] bg-neutrals-2 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ 
                            backgroundImage: `url(${cardData.coverPhotoUrl || cardData.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                {/* Edit Button (only if showEditButton) */}
                {showEditButton && (
                    <button
                        className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 group"
                        onClick={e => {
                            e.stopPropagation();
                            const experienceId = experience?.experienceId || experience?.id;
                            navigate(`/edit-experience/${experienceId}`);
                        }}
                        title="Edit Experience"
                        style={{ position: 'relative' }}
                    >
                        <Edit size={20} className="text-neutrals-1 group-hover:text-primary-1 transition-colors duration-200" />
                        {/* Tooltip on hover */}
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-primary-1 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                            Edit
                        </span>
                    </button>
                )}

                {/* Delete Button (only if showDeleteButton) */}
                {showDeleteButton && (
                    <button
                        className={`absolute top-4 left-16 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 group ${
                            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleDeleteClick}
                        title="Delete Experience"
                        disabled={isDeleting}
                        style={{ position: 'absolute' }}
                    >
                        {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Trash2 size={20} className="text-neutrals-1 group-hover:text-red-500 transition-colors duration-200" />
                        )}
                        {/* Tooltip on hover */}
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-red-500 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </span>
                    </button>
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