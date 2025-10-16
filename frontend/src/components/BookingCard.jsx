import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Star, Edit } from 'lucide-react';
import { useReviews } from '../contexts/ReviewContext';

const BookingCard = ({ booking }) => {
    const navigate = useNavigate();
    const { hasReviewForBooking, userReviews } = useReviews();
    const [hasWrittenReview, setHasWrittenReview] = useState(false);

    // Check if user has written a review for this booking
    useEffect(() => {
        if (booking.bookingId) {
            const hasReview = hasReviewForBooking(booking.bookingId);
            setHasWrittenReview(hasReview);
        }
    }, [booking.bookingId, hasReviewForBooking, userReviews]);

    const handleCardClick = () => {
        navigate(`/booking/${booking.bookingId}`);
    };

    const handleReviewClick = (e) => {
        e.stopPropagation(); // Prevent card click
        navigate(`/write-review/${booking.bookingId}`);
    };

    // Format booking date for display (handles both single day and multi-day)
    const formatBookingDate = (startDateTime, endDateTime) => {
        if (!startDateTime) return 'Date TBD';

        const startDate = new Date(startDateTime);
        const endDate = endDateTime ? new Date(endDateTime) : null;

        // Check if it's a multi-day experience
        const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();

        if (isMultiDay) {
            const startDateStr = startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            const endDateStr = endDate.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            return `${startDateStr} - ${endDateStr}`;
        } else {
            return startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    // Format time for display
    const formatTime = (dateTime) => {
        if (!dateTime) return 'Time TBD';
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Get status badge styling
    const getStatusBadge = (status) => {
        const statusConfig = {
            CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
            CANCELLED_BY_TOURIST: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
            CANCELLED_BY_GUIDE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
            COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    // Format price
    const formatPrice = (amount) => {
        if (!amount) return '$0';
        return `$${Math.round(amount)}`;
    };

    return (
        <div
            className="bg-white rounded-2xl border border-neutrals-6 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col h-full"
            onClick={handleCardClick}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[4/3] bg-neutrals-7 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url(${booking.experience?.coverPhotoUrl || booking.coverPhotoUrl || '/api/placeholder/400/300'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Status Badge Overlay */}
                <div className="absolute top-4 left-4">
                    {getStatusBadge(booking.status)}
                </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex flex-col h-full">
                {/* Experience Title and Location */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-neutrals-1 mb-2 line-clamp-2 min-h-[3.5rem]">
                        {booking.experience?.title || booking.experienceTitle || 'Experience Title'}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-neutrals-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{booking.experience?.country || booking.country || 'Country'}</span>
                    </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3 mb-4 flex-grow">
                    {/* Date and Time */}
                    <div className="flex items-start gap-2 text-sm text-neutrals-3 min-h-[3rem]">
                        <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="break-words">
                                {formatBookingDate(
                                    booking.experienceSchedule?.startDateTime || booking.bookingDate,
                                    booking.experienceSchedule?.endDateTime
                                )}
                            </div>
                            {/* Time Range */}
                            {booking.experienceSchedule?.startDateTime && booking.experienceSchedule?.endDateTime && (
                                <div className="text-neutrals-4 mt-1">
                                    {formatTime(booking.experienceSchedule.startDateTime)} - {formatTime(booking.experienceSchedule.endDateTime)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm text-neutrals-3">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{booking.numberOfParticipants || 1} {booking.numberOfParticipants === 1 ? 'guest' : 'guests'}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutrals-6 rounded-[1px] mb-4" />

                {/* Bottom Section */}
                <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-neutrals-4 truncate flex-1 mr-2">
                            Booking #{booking.confirmationCode || booking.bookingId}
                        </div>
                        <div className="text-lg font-bold text-primary-1 flex-shrink-0">
                            {formatPrice(booking.totalAmount)}
                        </div>
                    </div>

                    {/* Review Button for Completed Bookings */}
                    {booking.status === 'COMPLETED' && (
                        <div className="pt-2 border-t border-neutrals-6">
                            {hasWrittenReview ? (
                                <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium">
                                    <Edit className="w-4 h-4" />
                                    Review Written
                                </div>
                            ) : (
                                <button
                                    onClick={handleReviewClick}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-1 text-white rounded-lg hover:bg-primary-1/90 transition-colors text-sm font-medium"
                                >
                                    <Star className="w-4 h-4" />
                                    Leave Review
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingCard;