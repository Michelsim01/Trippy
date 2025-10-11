import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReviews } from '../contexts/ReviewContext';
import { Calendar, Users, MapPin, ExternalLink, Users as UsersChat, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormattedImportantInfo from '../components/FormattedImportantInfo';

const BookingDetailPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { hasReviewForBooking, userReviews } = useReviews();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCancellationForm, setShowCancellationForm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [hasWrittenReview, setHasWrittenReview] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setLoading(true);
                console.log('BookingDetailPage - Fetching booking:', bookingId);

                const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Booking not found');
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('BookingDetailPage - Fetched booking data:', data);

                // Transform API data to match component structure
                const transformedData = {
                    bookingId: data.bookingId,
                    confirmationCode: data.confirmationCode,
                    status: data.status,
                    numberOfParticipants: data.numberOfParticipants,
                    totalAmount: data.totalAmount,
                    serviceFee: data.serviceFee,
                    refundAmount: data.refundAmount,
                    bookingDate: data.bookingDate,
                    cancellationReason: data.cancellationReason,
                    cancelledAt: data.cancelledAt,
                    experience: {
                        experienceId: data.experienceId,
                        title: data.experienceTitle,
                        country: data.experienceCountry,
                        coverPhotoUrl: data.experienceCoverPhotoUrl,
                        shortDescription: data.experienceDescription,
                        importantInfo: data.experienceImportantInfo,
                        location: data.experienceLocation
                    },
                    experienceSchedule: {
                        startDateTime: data.startDateTime,
                        endDateTime: data.endDateTime
                    }
                };

                setBooking(transformedData);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch booking:", err);
                setError(err.message);
                setBooking(null);
            } finally {
                setLoading(false);
            }
        };

        if (bookingId && user?.id) {
            fetchBooking();
        } else if (!user?.id) {
            setError('Authentication required');
            setLoading(false);
        }
    }, [bookingId, user?.id]);

    // Check if user has written a review for this booking
    useEffect(() => {
        if (booking?.bookingId) {
            const hasReview = hasReviewForBooking(booking.bookingId);
            setHasWrittenReview(hasReview);
        }
    }, [booking?.bookingId, hasReviewForBooking]);

    const handleReviewClick = () => {
        navigate(`/write-review/${booking.bookingId}`);
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutrals-4">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-neutrals-2 mb-2">{error}</h3>
                    <p className="text-neutrals-4 mb-6">We couldn't load this booking. Please try again.</p>
                    <div className="space-x-4">
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutrals-4">Loading booking details...</p>
                </div>
            </div>
        );
    }

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
            CANCELLED_BY_GUIDE: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Cancelled by Guide' },
            COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    // Format price
    const formatPrice = (amount) => {
        if (!amount) return '$0';
        return `$${Math.round(amount)}`;
    };

    // Check if cancellation is allowed
    const canCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING';

    // Calculate refund amount based on cancellation policy
    const calculateRefund = () => {
        if (!booking || !booking.bookingDate || !booking.experienceSchedule?.startDateTime) {
            return { amount: 0, policy: 'Unable to calculate', explanation: 'Missing booking data' };
        }

        const now = new Date();
        const bookingCreated = new Date(booking.bookingDate);
        const experienceStart = new Date(booking.experienceSchedule.startDateTime);

        // Calculate hours since booking was created
        const hoursFromBooking = (now - bookingCreated) / (1000 * 60 * 60);

        // Calculate days until experience starts
        const hoursToExperience = (experienceStart - now) / (1000 * 60 * 60);
        const daysToExperience = hoursToExperience / 24;

        const totalAmount = booking.totalAmount || 0;
        const serviceFee = booking.serviceFee || 0;

        // Free cancellation: Within 24 hours of booking
        if (hoursFromBooking <= 24) {
            return {
                amount: totalAmount,
                policy: 'Free Cancellation',
                explanation: 'Full refund (within 24 hours of purchase)'
            };
        }

        // Standard cancellation policies based on time until experience
        if (daysToExperience >= 7) {
            return {
                amount: totalAmount - serviceFee,
                policy: '7+ Days Before',
                explanation: 'Full refund minus service fee'
            };
        } else if (daysToExperience >= 3) {
            return {
                amount: (totalAmount * 0.5) - serviceFee,
                policy: '3-6 Days Before',
                explanation: '50% refund minus service fee'
            };
        } else {
            return {
                amount: 0,
                policy: 'Less than 3 Days',
                explanation: 'Non-refundable'
            };
        }
    };

    const refundInfo = calculateRefund();

    // Handle show listing navigation
    const handleShowListing = () => {
        navigate(`/experience/${booking.experience.experienceId}`);
    };

    // Handle cancellation form submission
    const handleCancellationSubmit = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/bookings/${booking.bookingId}/cancel?reason=${encodeURIComponent(cancellationReason)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedBooking = await response.json();

            // Transform to match expected structure (same as initial fetch)
            const transformedBooking = {
                bookingId: updatedBooking.bookingId,
                confirmationCode: updatedBooking.confirmationCode,
                status: updatedBooking.status,
                numberOfParticipants: updatedBooking.numberOfParticipants,
                totalAmount: updatedBooking.totalAmount,
                serviceFee: updatedBooking.serviceFee,
                refundAmount: updatedBooking.refundAmount,
                bookingDate: updatedBooking.bookingDate,
                cancellationReason: updatedBooking.cancellationReason,
                cancelledAt: updatedBooking.cancelledAt,
                experience: {
                    experienceId: updatedBooking.experienceId,
                    title: updatedBooking.experienceTitle,
                    country: updatedBooking.experienceCountry,
                    coverPhotoUrl: updatedBooking.experienceCoverPhotoUrl,
                    shortDescription: updatedBooking.experienceDescription,
                    importantInfo: updatedBooking.experienceImportantInfo,
                    location: updatedBooking.experienceLocation
                },
                experienceSchedule: {
                    startDateTime: updatedBooking.startDateTime,
                    endDateTime: updatedBooking.endDateTime
                }
            };

            // Update the booking state with transformed data
            setBooking(transformedBooking);

            // Show success message with refund amount
            const refundAmount = updatedBooking.refundAmount || 0;
            alert(`Cancellation completed. Refund of $${Math.round(refundAmount)} will be processed within 5 working days.`);

            // Hide form and reset
            setShowCancellationForm(false);
            setCancellationReason('');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
            <Navbar
                isAuthenticated={true}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                variant="desktop"
            />

            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold text-neutrals-1">Booking Details</h1>
                            {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-neutrals-4">Confirmation Code: {booking.confirmationCode}</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Booking Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Experience Image and Title */}
                            <div className="bg-white rounded-2xl border border-neutrals-6 overflow-hidden">
                                <div className="aspect-[16/9] bg-neutrals-7">
                                    <div
                                        className="w-full h-full bg-cover bg-center bg-no-repeat"
                                        style={{
                                            backgroundImage: `url(${booking.experience.coverPhotoUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    />
                                </div>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-neutrals-1 mb-2">
                                        {booking.experience.title}
                                    </h2>
                                    <div className="flex items-center gap-2 text-neutrals-4 mb-4">
                                        <MapPin className="w-4 h-4" />
                                        <span>{booking.experience.country}</span>
                                    </div>
                                    <p className="text-neutrals-3 leading-relaxed">
                                        {booking.experience.shortDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Booking Information */}
                            <div className="bg-white rounded-2xl border border-neutrals-6 p-6">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Booking Information</h3>
                                <div className="space-y-4">
                                    {/* Date and Time */}
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-neutrals-4 mt-0.5" />
                                        <div>
                                            <p className="text-neutrals-2 font-medium">
                                                {formatBookingDate(
                                                    booking.experienceSchedule.startDateTime,
                                                    booking.experienceSchedule.endDateTime
                                                )}
                                            </p>
                                            {booking.experienceSchedule.startDateTime && booking.experienceSchedule.endDateTime && (
                                                <p className="text-neutrals-4 text-sm">
                                                    {formatTime(booking.experienceSchedule.startDateTime)} - {formatTime(booking.experienceSchedule.endDateTime)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Participants */}
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-neutrals-4" />
                                        <p className="text-neutrals-2">
                                            {booking.numberOfParticipants} {booking.numberOfParticipants === 1 ? 'guest' : 'guests'}
                                        </p>
                                    </div>

                                    {/* Total Amount */}
                                    <div className="flex items-center justify-between pt-4 border-t border-neutrals-6">
                                        <span className="text-neutrals-3">Total Paid</span>
                                        <span className="text-2xl font-bold text-primary-1">
                                            {formatPrice(booking.totalAmount)}
                                        </span>
                                    </div>

                                    {/* Refund Amount - Show for cancelled bookings */}
                                    {(booking.status === 'CANCELLED' ||
                                      booking.status === 'CANCELLED_BY_TOURIST' ||
                                      booking.status === 'CANCELLED_BY_GUIDE') &&
                                     booking.refundAmount !== null && booking.refundAmount !== undefined && (
                                        <div className="flex items-center justify-between pt-4 border-t border-neutrals-6">
                                            <span className="text-neutrals-3">Refund Amount</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                {formatPrice(booking.refundAmount)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Important Information */}
                            <div className="bg-white rounded-2xl border border-neutrals-6 p-6">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Important Information</h3>
                                <div className="bg-neutrals-7 rounded-lg p-4">
                                    <FormattedImportantInfo text={booking.experience.importantInfo} isMobile={false} />
                                </div>
                            </div>

                            {/* Meeting Point */}
                            <div className="bg-white rounded-2xl border border-neutrals-6 p-6">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Meeting Point</h3>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-neutrals-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-neutrals-3 leading-relaxed">
                                        {booking.experience.location}
                                    </p>
                                </div>
                            </div>

                            {/* Show Listing Button */}
                            <Button
                                variant="outline"
                                size="md"
                                onClick={handleShowListing}
                                className="w-full flex items-center justify-center gap-2 !rounded-2xl"
                            >
                                <ExternalLink className="w-5 h-5" />
                                <span>Show Original Listing</span>
                            </Button>
                        </div>

                        {/* Right Column - Cancellation Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-neutrals-6 p-6 sticky top-8">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Manage Booking</h3>

                                {/* Chat Buttons - For CONFIRMED and COMPLETED bookings */}
                                {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                                    <div className="space-y-3 mb-6">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate('/messages')}
                                            className="w-full flex items-center justify-center gap-2"
                                        >
                                            <UsersChat className="w-4 h-4" />
                                            Chat with Tour Group
                                        </Button>
                                    </div>
                                )}

                                {/* Divider if chat buttons are shown */}
                                {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                                    <div className="h-px bg-neutrals-6 rounded-[1px] mb-6" />
                                )}

                                {/* Review Section for Completed Bookings */}
                                {booking.status === 'COMPLETED' && (
                                    <div className="space-y-4 mb-6">
                                        <h4 className="font-medium text-neutrals-2">Share Your Experience</h4>
                                        {hasWrittenReview ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <Star className="w-5 h-5 fill-current" />
                                                    <span className="text-sm font-medium">Review submitted!</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-neutrals-4 text-sm">
                                                    Help other travelers by sharing your experience with this tour.
                                                </p>
                                                <Button
                                                    variant="primary"
                                                    size="md"
                                                    onClick={handleReviewClick}
                                                    className="w-full flex items-center justify-center gap-2"
                                                >
                                                    <Star className="w-4 h-4" />
                                                    Write Review
                                                </Button>
                                            </div>
                                        )}
                                        <div className="h-px bg-neutrals-6 rounded-[1px]" />
                                    </div>
                                )}

                                {canCancel && !showCancellationForm && (
                                    <div className="space-y-4">
                                        <p className="text-neutrals-4 text-sm">
                                            Need to cancel your booking? We'll help you with the cancellation process.
                                        </p>
                                        <Button
                                            variant="secondary"
                                            size="md"
                                            onClick={() => setShowCancellationForm(true)}
                                            className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                        >
                                            Cancel Booking
                                        </Button>
                                    </div>
                                )}

                                {canCancel && showCancellationForm && (
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-neutrals-2">Cancel Booking</h4>

                                        {/* Refund Summary */}
                                        <div className="bg-neutrals-7 rounded-lg p-4 border border-neutrals-6">
                                            <h5 className="text-sm font-medium text-neutrals-2 mb-3">Refund Summary</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Policy Applied:</span>
                                                    <span className="text-neutrals-2 font-medium">{refundInfo.policy}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Original Amount:</span>
                                                    <span className="text-neutrals-2">{formatPrice(booking.totalAmount)}</span>
                                                </div>
                                                {refundInfo.policy !== 'Free Cancellation' && refundInfo.amount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-neutrals-4">Service Fee:</span>
                                                        <span className="text-neutrals-2">-{formatPrice(booking.serviceFee)}</span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-neutrals-6">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium text-neutrals-2">Refund Amount:</span>
                                                        <span className={`font-bold text-lg ${refundInfo.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatPrice(Math.max(0, refundInfo.amount))}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-neutrals-4 mt-2 italic">{refundInfo.explanation}</p>
                                            </div>
                                        </div>

                                        {/* Cancellation Reason */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                Reason for cancellation
                                            </label>
                                            <select
                                                value={cancellationReason}
                                                onChange={(e) => setCancellationReason(e.target.value)}
                                                className="w-full p-3 border border-neutrals-6 rounded-lg focus:border-primary-1 focus:outline-none"
                                                style={{ padding: '6px' }}
                                            >
                                                <option value="">Select a reason</option>
                                                <option value="schedule_conflict">Schedule conflict</option>
                                                <option value="change_of_plans">Change of plans</option>
                                                <option value="emergency">Emergency</option>
                                                <option value="weather">Weather concerns</option>
                                                <option value="health">Health reasons</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>


                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <Button
                                                variant="primary"
                                                size="md"
                                                onClick={handleCancellationSubmit}
                                                disabled={!cancellationReason}
                                                className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                            >
                                                Confirm Cancellation
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="md"
                                                onClick={() => setShowCancellationForm(false)}
                                                className="w-full"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {!canCancel && (
                                    <div className="text-center py-4">
                                        <p className="text-neutrals-4 text-sm">
                                            {booking.status === 'CANCELLED' || booking.status === 'CANCELLED_BY_TOURIST'
                                                ? 'This booking has been cancelled and your refund will be shortly processed.'
                                                : booking.status === 'CANCELLED_BY_GUIDE'
                                                ? 'Your tour was cancelled by the guide. Full refund has been processed.'
                                                : 'This booking cannot be cancelled.'
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Cancellation Policy */}
                                <div className="mt-6 pt-6 border-t border-neutrals-6">
                                    <h4 className="font-medium text-neutrals-2 mb-2">Cancellation Policy</h4>
                                    <div className="text-xs text-neutrals-4 space-y-1">
                                        <p><strong>Free:</strong> 24 hours after purchase</p>
                                        <p><strong>7+ days before:</strong> Full refund (minus service fee)</p>
                                        <p><strong>3-6 days before:</strong> 50% refund (minus service fee)</p>
                                        <p><strong>&lt;3 days:</strong> Non-refundable</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BookingDetailPage;