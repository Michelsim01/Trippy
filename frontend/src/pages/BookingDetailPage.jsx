import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MapPin, Clock, ExternalLink, MessageCircle, Users as UsersChat } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Button from '../components/Button';

const BookingDetailPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [booking, setBooking] = useState(null);
    const [showCancellationForm, setShowCancellationForm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [cancellationDetails, setCancellationDetails] = useState('');

    // Mock booking data - in Phase 3 this will be fetched from API
    const mockBookings = {
        1: {
            bookingId: 1,
            confirmationCode: 'TRV001',
            status: 'CONFIRMED',
            numberOfParticipants: 2,
            totalAmount: 178,
            bookingDate: '2024-03-15T10:00:00',
            experience: {
                experienceId: 101,
                title: 'Amazing City Food Tour',
                country: 'Singapore',
                coverPhotoUrl: '/api/placeholder/400/300',
                shortDescription: 'Discover Singapore\'s vibrant food scene through hidden gems and local favorites in this guided culinary adventure.',
                importantInfo: 'Please wear comfortable walking shoes and bring an appetite! Vegetarian options available upon request. Tour operates rain or shine.',
                location: 'Marina Bay Sands Lobby, Level 1 (near the information counter)'
            },
            experienceSchedule: {
                startDateTime: '2024-03-25T10:00:00',
                endDateTime: '2024-03-25T15:30:00'
            }
        },
        2: {
            bookingId: 2,
            confirmationCode: 'TRV002',
            status: 'PENDING',
            numberOfParticipants: 4,
            totalAmount: 356,
            bookingDate: '2024-03-10T14:30:00',
            experience: {
                experienceId: 102,
                title: 'Cultural Heritage Walking Tour',
                country: 'Singapore',
                coverPhotoUrl: '/api/placeholder/400/300',
                shortDescription: 'Explore Singapore\'s rich cultural heritage through historic neighborhoods and traditional architecture.',
                importantInfo: 'This is a walking tour covering approximately 3km. Please wear comfortable shoes and sun protection. Some sites may have dress codes for temple visits.',
                location: 'Chinatown Heritage Centre, 48 Pagoda Street (near Chinatown MRT Station Exit A)'
            },
            experienceSchedule: {
                startDateTime: '2024-03-28T09:00:00',
                endDateTime: '2024-03-28T12:00:00'
            }
        },
        5: {
            bookingId: 5,
            confirmationCode: 'TRV005',
            status: 'CONFIRMED',
            numberOfParticipants: 2,
            totalAmount: 1250,
            bookingDate: '2024-03-12T13:45:00',
            experience: {
                experienceId: 105,
                title: '3-Day Southeast Asia Cultural Adventure',
                country: 'Malaysia & Indonesia',
                coverPhotoUrl: '/api/placeholder/400/300',
                shortDescription: 'An immersive multi-country journey exploring the diverse cultures, traditions, and cuisines of Southeast Asia.',
                importantInfo: 'Valid passport required for border crossings. Accommodation and meals included. Pack light - luggage storage provided. Travel insurance recommended.',
                location: 'Changi Airport Terminal 1, Level 2 Departure Hall (near Gate A5 area)'
            },
            experienceSchedule: {
                startDateTime: '2024-04-15T09:00:00',
                endDateTime: '2024-04-17T18:00:00'
            }
        }
    };

    useEffect(() => {
        // Mock data fetch - in Phase 3 this will be an API call
        const bookingData = mockBookings[bookingId];
        if (bookingData) {
            setBooking(bookingData);
        } else {
            // Handle booking not found
            navigate('/my-bookings');
        }
    }, [bookingId, navigate]);

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

    // Handle show listing navigation
    const handleShowListing = () => {
        navigate(`/experience/${booking.experience.experienceId}`);
    };

    // Handle cancellation form submission
    const handleCancellationSubmit = () => {
        // Phase 3: This will make API call to submit cancellation
        console.log('Cancellation submitted:', {
            bookingId: booking.bookingId,
            reason: cancellationReason,
            details: cancellationDetails
        });

        // For now, just show success message and hide form
        alert('Cancellation request submitted successfully. You will receive a confirmation email shortly.');
        setShowCancellationForm(false);
        setCancellationReason('');
        setCancellationDetails('');
    };

    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
            <Navbar
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
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/my-bookings')}
                        className="flex items-center gap-2 mb-6 !px-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to My Bookings</span>
                    </Button>

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
                                </div>
                            </div>

                            {/* Important Information */}
                            <div className="bg-white rounded-2xl border border-neutrals-6 p-6">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Important Information</h3>
                                <p className="text-neutrals-3 leading-relaxed">
                                    {booking.experience.importantInfo}
                                </p>
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

                                {/* Chat Buttons - Only for CONFIRMED bookings */}
                                {booking.status === 'CONFIRMED' && (
                                    <div className="space-y-3 mb-6">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => console.log('Chat with guide clicked')}
                                            className="w-full flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Chat with Guide
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => console.log('Chat with tour group clicked')}
                                            className="w-full flex items-center justify-center gap-2"
                                        >
                                            <UsersChat className="w-4 h-4" />
                                            Chat with Tour Group
                                        </Button>
                                    </div>
                                )}

                                {/* Divider if chat buttons are shown */}
                                {booking.status === 'CONFIRMED' && (
                                    <div className="h-px bg-neutrals-6 rounded-[1px] mb-6" />
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

                                        {/* Additional Details */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                Additional details (optional)
                                            </label>
                                            <textarea
                                                value={cancellationDetails}
                                                onChange={(e) => setCancellationDetails(e.target.value)}
                                                placeholder="Please provide any additional information..."
                                                rows={3}
                                                className="w-full p-3 border border-neutrals-6 rounded-lg focus:border-primary-1 focus:outline-none resize-none"
                                                style={{ padding: '6px' }}
                                            />
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
                                                Submit Cancellation Request
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
                                            {booking.status === 'CANCELLED'
                                                ? 'This booking has been cancelled.'
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
                                        <p><strong>7+ days:</strong> Full refund (minus service fee)</p>
                                        <p><strong>3-6 days:</strong> 50% refund</p>
                                        <p><strong>&lt;48 hours:</strong> Non-refundable</p>
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