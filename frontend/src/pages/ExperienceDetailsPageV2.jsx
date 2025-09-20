import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormData } from '../contexts/FormDataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatScheduleDisplay, formatDuration } from '../utils/experienceHelpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ExperienceHeader from '../components/experience-details/ExperienceHeader';
import ExperienceGallery from '../components/experience-details/ExperienceGallery';
import ExperienceContent from '../components/experience-details/ExperienceContent';
import BookingCard from '../components/experience-details/BookingCard';
import HostProfile from '../components/experience-details/HostProfile';

const ExperienceDetailsPageV2 = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();

  // Core data states
  const [experienceData, setExperienceData] = useState(null);
  const [mediaData, setMediaData] = useState([]);
  const [itinerariesData, setItinerariesData] = useState([]);
  const [schedulesData, setSchedulesData] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Booking states
  const [guests, setGuests] = useState(2);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  // Fetch experience data
  useEffect(() => {
    if (id) {
      fetchAllExperienceData();
    }
  }, [id]);

  // Check wishlist status
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (user && id) {
        try {
          const userId = user?.id || user?.userId;
          const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${userId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          });

          if (response.ok) {
            const wishlistItems = await response.json();
            const isInWishlist = wishlistItems.some(item =>
              (item.experience?.experienceId || item.experience?.id) === parseInt(id)
            );
            setIsWishlisted(isInWishlist);
          }
        } catch (error) {
          console.error('Error checking wishlist status:', error);
        }
      }
    };

    checkWishlistStatus();
  }, [user, id]);

  // Keyboard support for modals
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showAllSchedules && event.key === 'Escape') {
        setShowAllSchedules(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAllSchedules]);

  const fetchAllExperienceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [experienceResponse, mediaResponse, itinerariesResponse, schedulesResponse] = await Promise.all([
        fetch(`http://localhost:8080/api/experiences/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`http://localhost:8080/api/experiences/${id}/media`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`http://localhost:8080/api/experiences/${id}/itineraries`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`http://localhost:8080/api/experiences/${id}/schedules`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const [experience, media, itineraries, schedules] = await Promise.all([
        experienceResponse.ok ? experienceResponse.json() : null,
        mediaResponse.ok ? mediaResponse.json() : [],
        itinerariesResponse.ok ? itinerariesResponse.json() : [],
        schedulesResponse.ok ? schedulesResponse.json() : []
      ]);

      setExperienceData(experience);
      setMediaData(media || []);
      setItinerariesData(itineraries || []);
      setSchedulesData(schedules || []);

      updateFormData(experience);
    } catch (err) {
      console.error('Failed to fetch experience data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();

    const newWishlistState = !isWishlisted;
    setIsWishlisted(newWishlistState);

    try {
      const experienceId = displayData?.experienceId || id;
      const userId = user?.id || user?.userId;

      if (!userId) {
        console.error('No user ID available for wishlist operation');
        setIsWishlisted(!newWishlistState);
        return;
      }

      if (newWishlistState) {
        const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${userId}/experience/${experienceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          setIsWishlisted(!newWishlistState);
          console.error('Failed to add to wishlist');
        }
      } else {
        const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${userId}/experience/${experienceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          setIsWishlisted(!newWishlistState);
          console.error('Failed to remove from wishlist');
        }
      }
    } catch (error) {
      setIsWishlisted(!newWishlistState);
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleGuideProfileClick = () => {
    if (displayData.guide && displayData.guide.userId) {
      navigate(`/profile/${displayData.guide.userId}`);
    } else {
      alert('Guide profile is not available');
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Use experienceData if available (from API), otherwise use formData (from context)
  const displayData = experienceData || formData;

  // Process highlights array
  let highlightsArray;
  if (Array.isArray(displayData.highlights)) {
    highlightsArray = displayData.highlights.length > 0 ? displayData.highlights : [
      'Explore local eateries and street food culture',
      'Try 15 different dishes across 4 authentic venues',
      'Expert local guide with insider knowledge',
      'Small group experience (max 8 people)',
      'Vegetarian and dietary restrictions accommodated'
    ];
  } else if (typeof displayData.highlights === 'string' && displayData.highlights.trim()) {
    highlightsArray = displayData.highlights.split(',').filter(h => h.trim());
  } else {
    highlightsArray = [
      'Explore local eateries and street food culture',
      'Try 15 different dishes across 4 authentic venues',
      'Expert local guide with insider knowledge',
      'Small group experience (max 8 people)',
      'Vegetarian and dietary restrictions accommodated'
    ];
  }

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      name: 'Samson Heathcote',
      rating: 5,
      comment: 'We had the most spectacular view. Unfortunately it was very hot in the room from 2-830 pm due to no air conditioning and no shade.',
      timeAgo: 'about 1 hour ago',
      avatar: 'http://localhost:3845/assets/5b2da3c4f1fe1e54e1660b1f2dbb1b9db0a7edfa.png'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      rating: 5,
      comment: 'Amazing food tour! Our guide was incredibly knowledgeable and took us to places we never would have found on our own.',
      timeAgo: 'about 2 hours ago',
      avatar: 'http://localhost:3845/assets/abaa1902a5b21cb97c07d76b1c3467c83aa100ab.png'
    },
    {
      id: 3,
      name: 'Mike Chen',
      rating: 4,
      comment: 'Great variety of food and excellent service. The local insights were invaluable.',
      timeAgo: 'about 3 hours ago',
      avatar: 'http://localhost:3845/assets/e58cbf84a937d190296bbe7304653e0c9568e4ce.png'
    }
  ];

  const relatedTours = [
    {
      id: 1,
      title: 'Venice, Rome & Milan',
      location: 'Karineside',
      price: 548,
      originalPrice: 699,
      rating: 4.9,
      image: 'http://localhost:3845/assets/f5acba007cc57e5c56e48f53ba4139382e8c62f9.png',
      dates: 'Tue, Jul 20 - Fri, Jul 23'
    },
    {
      id: 2,
      title: 'Florence Art & Culture',
      location: 'Historic Center',
      price: 425,
      originalPrice: 550,
      rating: 4.8,
      image: 'http://localhost:3845/assets/f5506261d9ca04e13fc0b119992337acb5cff52a.png',
      dates: 'Mon, Jul 26 - Thu, Jul 29'
    },
    {
      id: 3,
      title: 'Tuscany Wine Experience',
      location: 'Chianti Region',
      price: 680,
      originalPrice: 850,
      rating: 4.9,
      image: 'http://localhost:3845/assets/a1d053f86ede5fe9f5d710d9dea9809e92f5fbce.png',
      dates: 'Sat, Aug 7 - Sun, Aug 8'
    }
  ];

  // Loading state
  if (loading && id) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-neutrals-2">Loading experience...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && id) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600">Error loading experience</div>
          <p className="text-neutrals-3 mt-2">{error}</p>
          <button
            onClick={fetchAllExperienceData}
            className="mt-4 bg-primary-1 text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            Try Again
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
            isAuthenticated={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          <div className="flex-1" style={{ paddingTop: '40px', paddingBottom: '100px' }}>
            <div className="max-w-7xl mx-auto px-10">
              <ExperienceHeader
                displayData={displayData}
                isWishlisted={isWishlisted}
                handleWishlistToggle={handleWishlistToggle}
                isMobile={false}
              />

              <ExperienceGallery
                mediaData={mediaData}
                displayData={displayData}
                isMobile={false}
              />

              {displayData.shortDescription && (
                <div className="mb-8">
                  <p className="text-neutrals-3 text-lg leading-relaxed break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {displayData.shortDescription}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-12 min-w-0">
                <div className="col-span-2 space-y-8 min-w-0 overflow-hidden">
                  <ExperienceContent
                    displayData={displayData}
                    itinerariesData={itinerariesData}
                    highlightsArray={highlightsArray}
                    isMobile={false}
                  />
                </div>

                <div className="col-span-1">
                  <BookingCard
                    displayData={displayData}
                    schedulesData={schedulesData}
                    formatScheduleDisplay={formatScheduleDisplay}
                    formatDuration={formatDuration}
                    guests={guests}
                    setGuests={setGuests}
                    selectedSchedule={selectedSchedule}
                    setSelectedSchedule={setSelectedSchedule}
                    setShowAllSchedules={setShowAllSchedules}
                    reviews={reviews}
                    isMobile={false}
                  />
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="max-w-7xl mx-auto px-10 mt-16">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-neutrals-2 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Reviews
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold text-neutrals-2">{displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '4.8'}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-neutrals-4">Based on {displayData.totalReviews || 256} reviews</span>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-neutrals-6 pb-6">
                    <div className="flex gap-4">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutrals-2">{review.name}</h4>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <svg key={i} className="w-4 h-4 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-neutrals-3 mb-2" style={{ fontSize: '14px', lineHeight: '24px' }}>
                          {review.comment}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-neutrals-4">
                          <span>{review.timeAgo}</span>
                          <button className="font-semibold text-neutrals-2 hover:text-primary-1">Like</button>
                          <button className="font-semibold text-neutrals-2 hover:text-primary-1">Reply</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About your host */}
            <HostProfile
              displayData={displayData}
              onGuideProfileClick={handleGuideProfileClick}
            />
                        
            {/* Related Tours (hard coded now) */} 
            <div className="max-w-7xl mx-auto px-10 mt-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-neutrals-4 text-xs uppercase font-bold mb-2" style={{ fontFamily: 'Poppins' }}>The perfect trip</p>
                  <h2 className="text-5xl font-bold text-neutrals-2" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.96px' }}>
                    You may be interested in
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 border-2 border-neutrals-6 rounded-full hover:bg-neutrals-7">
                    <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-2 border-2 border-neutrals-6 rounded-full hover:bg-neutrals-7">
                    <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {relatedTours.map((tour) => (
                  <div key={tour.id} className="bg-neutrals-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="relative h-48">
                      <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                      <button className="absolute top-4 right-4 p-2 bg-neutrals-8 rounded-full shadow-lg">
                        <svg className="w-4 h-4 text-primary-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-neutrals-2 mb-2">{tour.title}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutrals-3">{tour.location}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-neutrals-5 line-through">${tour.originalPrice}</span>
                          <span className="text-xs text-primary-1 font-bold">${tour.price}</span>
                        </div>
                      </div>
                      <div className="border-t border-neutrals-6 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutrals-4">{tour.dates}</span>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold text-neutrals-2">{tour.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        <Navbar
          isAuthenticated={true}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <div className="pt-16 pb-8">
          <div className="px-4">
            <ExperienceHeader
              displayData={displayData}
              isWishlisted={isWishlisted}
              handleWishlistToggle={handleWishlistToggle}
              isMobile={true}
            />

            <ExperienceGallery
              mediaData={mediaData}
              displayData={displayData}
              isMobile={true}
            />

            {displayData.shortDescription && (
              <div className="mb-6 px-2">
                <p className="text-neutrals-3 text-base leading-relaxed break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {displayData.shortDescription}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <ExperienceContent
                displayData={displayData}
                itinerariesData={itinerariesData}
                highlightsArray={highlightsArray}
                isMobile={true}
              />
            </div>

            {/* Mobile Booking Card */}
            <div className="mt-6">
              <BookingCard
                displayData={displayData}
                schedulesData={schedulesData}
                formatScheduleDisplay={formatScheduleDisplay}
                formatDuration={formatDuration}
                guests={guests}
                setGuests={setGuests}
                selectedSchedule={selectedSchedule}
                setSelectedSchedule={setSelectedSchedule}
                setShowAllSchedules={setShowAllSchedules}
                reviews={reviews}
                isMobile={true}
              />
            </div>
          </div>

          {/* Mobile Reviews Section */}
          <div className="px-4 mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutrals-2 mb-2" style={{ fontFamily: 'Poppins' }}>
                Reviews
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-neutrals-2">{displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '4.8'}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="text-neutrals-4 text-sm">Based on {displayData.totalReviews || 256} reviews</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-neutrals-6 pb-4">
                  <div className="flex gap-3">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-neutrals-2 text-sm">{review.name}</h4>
                        <div className="flex">
                          {[...Array(review.rating)].map((_, i) => (
                            <svg key={i} className="w-3 h-3 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-neutrals-3 mb-2 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-neutrals-4">
                        <span>{review.timeAgo}</span>
                        <button className="font-semibold text-neutrals-2 hover:text-primary-1">Like</button>
                        <button className="font-semibold text-neutrals-2 hover:text-primary-1">Reply</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Host Profile */}
          <HostProfile
            displayData={displayData}
            onGuideProfileClick={handleGuideProfileClick}
            isMobile={true}
          />

          {/* Mobile Related Tours */}
          <div className="px-4 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-neutrals-4 text-xs uppercase font-bold mb-1" style={{ fontFamily: 'Poppins' }}>The perfect trip</p>
                <h2 className="text-2xl font-bold text-neutrals-2" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.96px' }}>
                  You may be interested in
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {relatedTours.map((tour) => (
                  <div key={tour.id} className="bg-neutrals-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow" style={{ width: '280px', flexShrink: 0 }}>
                    <div className="relative h-40">
                      <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                      <button className="absolute top-3 right-3 p-2 bg-neutrals-8 rounded-full shadow-lg">
                        <svg className="w-4 h-4 text-primary-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-neutrals-2 mb-2 text-sm">{tour.title}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutrals-3">{tour.location}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-neutrals-5 line-through">${tour.originalPrice}</span>
                          <span className="text-xs text-primary-1 font-bold">${tour.price}</span>
                        </div>
                      </div>
                      <div className="border-t border-neutrals-6 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutrals-4">{tour.dates}</span>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold text-neutrals-2">{tour.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Show All Schedules Modal */}
      {showAllSchedules && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutrals-6 p-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-neutrals-2">All Available Dates</h3>
              <button
                onClick={() => setShowAllSchedules(false)}
                className="text-neutrals-4 hover:text-neutrals-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-3">
                {schedulesData && schedulesData.length > 0 ? (
                  schedulesData.map((schedule, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        selectedSchedule === index
                          ? 'border-primary-1 bg-primary-1 bg-opacity-10'
                          : 'border-neutrals-6 hover:border-primary-1'
                      }`}
                      onClick={() => {
                        setSelectedSchedule(index);
                        setShowAllSchedules(false);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          {(() => {
                            const formattedSchedule = formatScheduleDisplay(schedule);
                            return (
                              <>
                                <div className={`font-semibold ${selectedSchedule === index ? 'text-primary-1' : 'text-neutrals-2'}`}>
                                  {formattedSchedule.dateText}
                                </div>
                                <div className="text-sm text-neutrals-4">
                                  {formattedSchedule.timeText}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-sm text-neutrals-4">
                          {schedule.availableSpots || 4} spots available
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback demo schedules for modal
                  <>
                    {['Sunday, 5 October', 'Monday, 6 October', 'Tuesday, 7 October', 'Wednesday, 8 October', 'Thursday, 9 October', 'Friday, 10 October', 'Saturday, 11 October'].map((date, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                          selectedSchedule === `demo-${index}`
                            ? 'border-primary-1 bg-primary-1 bg-opacity-10'
                            : 'border-neutrals-6 hover:border-primary-1'
                        }`}
                        onClick={() => {
                          setSelectedSchedule(`demo-${index}`);
                          setShowAllSchedules(false);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`font-semibold ${selectedSchedule === `demo-${index}` ? 'text-primary-1' : 'text-neutrals-2'}`}>{date}</div>
                            <div className="text-sm text-neutrals-4">10:00 am - 3:30 pm</div>
                          </div>
                          <div className="text-sm text-neutrals-4">4 spots available</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceDetailsPageV2;