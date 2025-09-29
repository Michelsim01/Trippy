import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReviewForm from '../components/reviews/ReviewForm';
import { useAuth } from '../contexts/AuthContext';

const WriteReviewPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [booking, setBooking] = useState(null);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Booking not found');
        }

        const bookingData = await response.json();

        // TEMPORARY: Skip authorization check for testing
        console.log('⚠️ TEMPORARY: Skipping authorization check for testing');
        console.log('🔍 Booking data received:', bookingData);

        // TODO: Fix backend to include traveler info, then re-enable this:
        // if (String(bookingData.traveler?.id) !== String(user.id)) {
        //   throw new Error('Unauthorized access to this booking');
        // }

        // Verify booking is completed
        if (bookingData.status !== 'COMPLETED') {
          throw new Error('Can only review completed bookings');
        }

        setBooking(bookingData);

        // Construct experience object from flattened BookingResponseDTO
        const experienceData = {
          experienceId: bookingData.experienceId,
          title: bookingData.experienceTitle,
          shortDescription: bookingData.experienceDescription,
          location: bookingData.experienceLocation,
          country: bookingData.experienceCountry,
          price: bookingData.experiencePrice,
          coverPhotoUrl: bookingData.experienceCoverPhotoUrl,
          importantInfo: bookingData.experienceImportantInfo
        };

        setExperience(experienceData);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, user?.id]);

  const handleReviewSubmit = (reviewData) => {
    // Use trip points from the review response, fallback to 10
    const tripPointsEarned = reviewData?.tripPointsEarned || 10;

    // Show success and redirect to profile reviews tab to show the new review
    navigate(`/profile/${user.id}?tab=reviews`, {
      state: {
        message: `Review submitted successfully! You earned ${tripPointsEarned} TripPoints.`
      }
    });
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          isAuthenticated={true}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="desktop"
          isAuthenticated={true}
        />

        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-1 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking || !experience) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          isAuthenticated={true}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="desktop"
          isAuthenticated={true}
        />

        <div className="max-w-4xl mx-auto py-8 px-4">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center text-primary-1 hover:text-primary-1/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Bookings
          </button>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-red-200">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Unable to Load Review Form
              </div>
              <p className="text-gray-600 mb-4">
                {error || 'Booking or experience data could not be found.'}
              </p>
              <button
                onClick={() => navigate('/my-bookings')}
                className="bg-primary-1 text-white px-6 py-2 rounded-md hover:bg-primary-1/90 transition-colors"
              >
                Return to My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        isAuthenticated={true}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant="desktop"
        isAuthenticated={true}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-1 hover:text-primary-1/80 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Write a Review
          </h1>
          <p className="text-gray-600">
            Share your experience to help other travelers make informed decisions.
          </p>
        </div>

        {/* Review Form */}
        <ReviewForm
          booking={booking}
          experience={experience}
          onSubmit={handleReviewSubmit}
          onCancel={handleCancel}
          isModal={false}
        />
      </div>
    </div>
  );
};

export default WriteReviewPage;