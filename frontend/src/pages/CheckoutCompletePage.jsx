import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../contexts/CheckoutContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function CheckoutCompletePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const {
    experienceData,
    scheduleData,
    booking,
    transaction,
    numberOfParticipants,
    contactInfo,
    error: checkoutError
  } = useCheckout();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  // Check authorization and required data on mount
  useEffect(() => {
    if (!isLoading) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        setError('Please log in to view this page');
        navigate(ROUTES.LOGIN);
        return;
      }

      // Check if we have required booking data
      if (!experienceData || !scheduleData || !booking || !transaction) {
        setError('Missing booking information. Please complete your booking first.');
        // Optional: redirect to home after showing error
        setTimeout(() => navigate(ROUTES.HOME), ERROR_REDIRECT_DELAY);
        return;
      }

      // Check if the booking belongs to the current user
      if (booking.userId && user?.id && booking.userId !== user.id) {
        setError('You are not authorized to view this booking');
        navigate(ROUTES.HOME);
        return;
      }
    }
  }, [isAuthenticated, isLoading, experienceData, scheduleData, booking, transaction, user, navigate]);

  // Format date from LocalDateTime (startDateTime)
  const formatDate = (dateTimeString) => {
    try {
      if (!dateTimeString) {
        return 'Date TBD';
      }

      // Parse LocalDateTime string (ISO format: "2024-10-03T10:00:00")
      const date = new Date(dateTimeString);

      if (isNaN(date.getTime())) {
        return dateTimeString;
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return dateTimeString;
    }
  };

  // Format time from LocalDateTime strings (startDateTime, endDateTime)
  const formatTime = (startDateTimeString, endDateTimeString) => {
    try {
      if (!startDateTimeString || !endDateTimeString) {
        return 'Time TBD';
      }

      // Parse LocalDateTime strings (ISO format: "2024-10-03T10:00:00")
      const startDate = new Date(startDateTimeString);
      const endDate = new Date(endDateTimeString);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return `${startDateTimeString} - ${endDateTimeString}`;
      }

      const formatTime = (date) => date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return `${formatTime(startDate)} - ${formatTime(endDate)}`;
    } catch (error) {
      return `${startDateTimeString} - ${endDateTimeString}`;
    }
  };

  // Constants
  const DEFAULT_COVER_IMAGE = '/images/default-experience-cover.jpg';
  const DEFAULT_AVATAR = '/images/default-avatar.jpg';
  const DEFAULT_RATING = 5.0;
  const ERROR_REDIRECT_DELAY = 3000; // 3 seconds

  // Routes
  const ROUTES = {
    LOGIN: '/login',
    HOME: '/home',
    MESSAGES: '/messages'
  };

  // Create booking data from real context data
  const bookingData = experienceData && scheduleData ? {
    experience: {
      title: experienceData.title,
      coverPhotoUrl: experienceData.coverPhotoUrl || experienceData.photoUrls?.[0] || DEFAULT_COVER_IMAGE,
      guide: {
        name: experienceData.hostName || experienceData.guide?.name || 'Host',
        avatar: experienceData.hostAvatar || experienceData.guide?.avatar || DEFAULT_AVATAR,
        rating: experienceData.rating || experienceData.guide?.rating || DEFAULT_RATING
      }
    },
    date: formatDate(scheduleData.startDateTime),
    time: formatTime(scheduleData.startDateTime, scheduleData.endDateTime),
    guests: numberOfParticipants,
    meetingPoint: scheduleData.meetingPoint || experienceData.meetingPoint || 'Meeting point TBD'
  } : null;

  const handleChatWithGuide = () => {
    // Navigate to chat or messages page
    navigate(ROUTES.MESSAGES);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutrals-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error || checkoutError) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-neutrals-4 mb-4">
            {error || checkoutError}
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show error if no booking data
  if (!bookingData) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">No Booking Data</h2>
          </div>
          <p className="text-neutrals-4 mb-4">
            Unable to load booking information. Please try again.
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={isAuthenticated}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          {/* Main Content */}
          <div className="max-w-4xl mx-auto py-16 px-8">
            <div className="bg-white rounded-2xl p-12 text-center">
              {/* Success Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Success Message */}
                <div className="text-left">
                  {/* Celebration Icon */}
                  <div className="w-20 h-20 mb-8">
                    <div className="text-6xl">🎉</div>
                  </div>

                  <div className="mb-6">
                    <p className="text-lg text-neutrals-4 mb-2">Thank you!</p>
                    <h1 className="text-4xl font-bold text-neutrals-1 leading-tight">
                      Your order has been received
                    </h1>
                  </div>

                  {/* Experience Details */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutrals-1 mb-4">
                      {bookingData.experience.title}
                    </h2>

                    {/* Guide Info */}
                    <div className="flex items-center gap-3 mb-6">
                      <img
                        src={bookingData.experience.guide.avatar}
                        alt={bookingData.experience.guide.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-lg font-medium text-neutrals-1">
                        {bookingData.experience.guide.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-lg font-medium text-neutrals-3">
                          {bookingData.experience.guide.rating}
                        </span>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-4 bg-neutrals-8 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-6 h-6 text-neutrals-4" />
                        <div>
                          <p className="text-sm font-medium text-neutrals-5 uppercase">Date</p>
                          <p className="text-lg font-semibold text-neutrals-1">{bookingData.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Clock className="w-6 h-6 text-neutrals-4" />
                        <div>
                          <p className="text-sm font-medium text-neutrals-5 uppercase">Time</p>
                          <p className="text-lg font-semibold text-neutrals-1">{bookingData.time}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Users className="w-6 h-6 text-neutrals-4" />
                        <div>
                          <p className="text-sm font-medium text-neutrals-5 uppercase">Guests</p>
                          <p className="text-lg font-semibold text-neutrals-1">{bookingData.guests}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <MapPin className="w-6 h-6 text-neutrals-4" />
                        <div>
                          <p className="text-sm font-medium text-neutrals-5 uppercase">Meeting Point</p>
                          <p className="text-lg font-semibold text-neutrals-1">{bookingData.meetingPoint}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Your Trip Section */}
                  <div className="bg-neutrals-8 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-neutrals-1 mb-4 text-center">Your trip</h3>
                    <button
                      onClick={handleChatWithGuide}
                      className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors text-lg shadow-lg hover:shadow-xl"
                    >
                      Chat with your tour guide
                    </button>
                  </div>
                </div>

                {/* Right Column - Experience Image */}
                <div className="lg:order-last">
                  <img
                    src={bookingData.experience.coverPhotoUrl}
                    alt={bookingData.experience.title}
                    className="w-full h-96 object-cover rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={isAuthenticated}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />

        <main className="w-full">
          <div className="py-6 px-4">
            <div className="bg-white rounded-xl p-6">
              {/* Experience Image */}
              <div className="mb-6">
                <img
                  src={bookingData.experience.coverPhotoUrl}
                  alt={bookingData.experience.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>

              {/* Celebration Icon */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-base text-neutrals-4 mb-2">Thank you!</p>
                <h1 className="text-2xl font-bold text-neutrals-1 leading-tight">
                  Your order has been received
                </h1>
              </div>

              {/* Experience Details */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-neutrals-1 mb-4">
                  {bookingData.experience.title}
                </h2>

                {/* Guide Info */}
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src={bookingData.experience.guide.avatar}
                    alt={bookingData.experience.guide.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-base font-medium text-neutrals-1">
                    {bookingData.experience.guide.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-base font-medium text-neutrals-3">
                      {bookingData.experience.guide.rating}
                    </span>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-4 bg-neutrals-8 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-neutrals-4" />
                    <div>
                      <p className="text-xs font-medium text-neutrals-5 uppercase">Date</p>
                      <p className="text-sm font-semibold text-neutrals-1">{bookingData.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-neutrals-4" />
                    <div>
                      <p className="text-xs font-medium text-neutrals-5 uppercase">Time</p>
                      <p className="text-sm font-semibold text-neutrals-1">{bookingData.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-neutrals-4" />
                    <div>
                      <p className="text-xs font-medium text-neutrals-5 uppercase">Guests</p>
                      <p className="text-sm font-semibold text-neutrals-1">{bookingData.guests}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-neutrals-4" />
                    <div>
                      <p className="text-xs font-medium text-neutrals-5 uppercase">Meeting Point</p>
                      <p className="text-sm font-semibold text-neutrals-1">{bookingData.meetingPoint}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Trip Section */}
              <div className="bg-neutrals-8 rounded-xl p-4">
                <h3 className="text-base font-bold text-neutrals-1 mb-4 text-center">Your trip</h3>
                <button
                  onClick={handleChatWithGuide}
                  className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors shadow-lg hover:shadow-xl"
                >
                  Chat with your tour guide
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}