import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Star, Edit2, CheckCircle } from 'lucide-react';
import { useReviews } from '../contexts/ReviewContext';
import ReviewForm from './reviews/ReviewForm';

const BookingCard = ({ booking }) => {
    const navigate = useNavigate();
    const { hasReviewForBooking, canReviewBooking } = useReviews();

    // State for review functionality
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [canWriteReview, setCanWriteReview] = useState(false);
    const [hasWrittenReview, setHasWrittenReview] = useState(false);

    // Check review status when component mounts
    useEffect(() => {
        const checkReviewStatus = async () => {
            if (booking.status === 'COMPLETED') {
                // TEMPORARY FIX: Skip the API calls for now and show review button
                console.log('🔍 COMPLETED booking found:', booking.bookingId);
                setCanWriteReview(true);  // Always allow review for completed bookings
                setHasWrittenReview(false); // Assume no review for now

                // TODO: Re-enable this when backend endpoints are ready
                // const hasReview = hasReviewForBooking(booking.bookingId);
                // setHasWrittenReview(hasReview);
                // if (!hasReview) {
                //     const canReview = await canReviewBooking(booking.bookingId);
                //     setCanWriteReview(canReview);
                // }
            }
        };

        checkReviewStatus();
    }, [booking.bookingId, booking.status]);

    const handleCardClick = (e) => {
        // Prevent navigation if clicking on review buttons
        if (e.target.closest('.review-action')) {
            e.stopPropagation();
            return;
        }
        navigate(`/booking/${booking.bookingId}`);
    };

    const handleWriteReview = (e) => {
        e.stopPropagation();
        navigate(`/write-review/${booking.bookingId}`);
    };

    const handleReviewSubmitted = () => {
        setShowReviewForm(false);
        setHasWrittenReview(true);
        setCanWriteReview(false);
    };

    const handleCloseReviewForm = () => {
        setShowReviewForm(false);
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

                {/* Review Prompt Section */}
                {booking.status === 'COMPLETED' && (
                    <div className="mb-4">
                        {canWriteReview && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-900">
                                            Share your experience
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Help other travelers and earn 10 TripPoints
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleWriteReview}
                                        className="review-action flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <Star className="w-3 h-3" />
                                        Write Review
                                    </button>
                                </div>
                            </div>
                        )}

                        {hasWrittenReview && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-900">
                                            Review submitted
                                        </p>
                                        <p className="text-xs text-green-700">
                                            Thank you for sharing your experience!
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleWriteReview}
                                        className="review-action flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-md hover:bg-green-200 transition-colors"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        Edit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Section */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="text-sm text-neutrals-4 truncate flex-1 mr-2">
                        Booking #{booking.confirmationCode || booking.bookingId}
                    </div>
                    <div className="text-lg font-bold text-primary-1 flex-shrink-0">
                        {formatPrice(booking.totalAmount)}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BookingCard;