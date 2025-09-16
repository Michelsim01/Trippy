import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import { useAuth } from '../contexts/AuthContext';
import { convertTo12Hr, generateScheduleRecords } from '../utils/scheduleGenerator';
import { experienceApi } from '../services/experienceApi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Utility function to parse and format important info text
const parseImportantInfo = (text) => {
  if (!text) return [];
  
  const lines = text.split('\n').filter(line => line.trim());
  const elements = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    // Detect numbered lines (1. 2. 3. etc.) - these are bullet points
    if (trimmed.match(/^\d+[\.\)]\s/)) {
      const content = trimmed.replace(/^\d+[\.\)]\s/, '');
      elements.push({ type: 'bullet', content });
    }
    // All other non-empty lines are headers
    else if (trimmed.length > 0) {
      elements.push({ type: 'header', content: trimmed });
    }
  }
  
  return elements;
};

// Helper function to convert category enum to display name
const getCategoryDisplayName = (enumValue) => {
  const categoryDisplayMap = {
    'GUIDED_TOUR': 'Guided Tour',
    'DAYTRIP': 'Day Trip',
    'ADVENTURE': 'Adventure & Sports',
    'WORKSHOP': 'Workshop & Classes',
    'WATER_ACTIVITY': 'Water Activities',
    'OTHERS': 'Others'
  };
  return categoryDisplayMap[enumValue] || enumValue;
};

// Helper function to format schedule display
const formatScheduleDisplay = (schedule) => {
  if (!schedule) {
    return {
      dateText: 'Invalid Date',
      timeText: 'Invalid Time'
    };
  }

  // Use the schedule's startDateTime and endDateTime for formatting
  if (schedule.startDateTime && schedule.endDateTime) {
    const startDateTime = new Date(schedule.startDateTime);
    const endDateTime = new Date(schedule.endDateTime);

    // Check if it's a multi-day schedule (different days)
    const isMultiDay = startDateTime.toDateString() !== endDateTime.toDateString();

    if (isMultiDay) {
      const startDateStr = startDateTime.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
      });
      const endDateStr = endDateTime.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
      });

      return {
        dateText: `${startDateStr} - ${endDateStr}`,
        timeText: `${startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      };
    } else {
      return {
        dateText: startDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }),
        timeText: `${startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      };
    }
  }

  // Fallback to old format if startDateTime/endDateTime not available but date/startTime/endTime are
  if (schedule.date && schedule.startTime && schedule.endTime) {
    return {
      dateText: new Date(schedule.date).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }),
      timeText: `${convertTo12Hr(schedule.startTime)} - ${convertTo12Hr(schedule.endTime)}`
    };
  }

  return {
    dateText: 'Invalid Date',
    timeText: 'Invalid Time'
  };
};

// Helper function to get guide initials
const getGuideInitials = (guide) => {
  if (!guide || !guide.firstName) return 'G';
  const firstName = guide.firstName || '';
  const lastName = guide.lastName || '';
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
};

// Helper function to get guide full name
const getGuideFullName = (guide) => {
  if (!guide) return 'Guide';
  const firstName = guide.firstName || '';
  const lastName = guide.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'Guide';
};

// Helper function to format duration display using experience duration or schedules
const formatDuration = (experienceData, schedulesData) => {
  // First try to use the experience duration field if available
  if (experienceData && experienceData.duration) {
    const hours = parseFloat(experienceData.duration);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} Day${days > 1 ? 's' : ''}`;
    } else if (hours === Math.floor(hours)) {
      return `${hours} Hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} Hours`;
    }
  }

  // Fallback: calculate from schedules if available
  if (schedulesData && schedulesData.length > 0) {
    const firstSchedule = schedulesData[0];
    const lastSchedule = schedulesData[schedulesData.length - 1];

    if (firstSchedule.startDateTime && lastSchedule.endDateTime) {
      const start = new Date(firstSchedule.startDateTime);
      const end = new Date(lastSchedule.endDateTime);
      const durationMs = end - start;
      const hours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} Day${days > 1 ? 's' : ''}`;
      } else if (hours === Math.floor(hours)) {
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} Hours`;
      }
    }
  }

  // Default fallback
  return null;
};

// Component to render formatted important info
const FormattedImportantInfo = ({ text, isMobile = false }) => {
  const elements = parseImportantInfo(text);
  
  return (
    <div className="space-y-3">
      {elements.map((element, index) => {
        if (element.type === 'header') {
          return (
            <h3 key={index} className={`font-semibold text-neutrals-1 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ fontFamily: 'Poppins' }}>
              {element.content}
            </h3>
          );
        } else if (element.type === 'bullet') {
          return (
            <div key={index} className={`text-neutrals-3 ${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed flex items-start ml-4`}>
              <span className="text-neutrals-4 mr-2 flex-shrink-0 mt-1">•</span>
              <span>{element.content}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

const ExperienceDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();
  const [experienceData, setExperienceData] = useState(null);
  const [mediaData, setMediaData] = useState([]);
  const [itinerariesData, setItinerariesData] = useState([]);
  const [schedulesData, setSchedulesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Fetch experience data if ID is provided
  useEffect(() => {
    if (id) {
      fetchAllExperienceData();
    }
  }, [id]);

  // Check if experience is in user's wishlist
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
  
  const fetchAllExperienceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [experience, media, itineraries, schedules] = await Promise.all([
        experienceApi.getExperienceById(id),
        experienceApi.getExperienceMedia(id),
        experienceApi.getExperienceItineraries(id),
        experienceApi.getExperienceSchedules(id)
      ]);
      
      setExperienceData(experience);
      setMediaData(media || []);
      setItinerariesData(itineraries || []);
      setSchedulesData(schedules || []);
      
      // Also update formData for compatibility
      updateFormData(experience);
    } catch (err) {
      console.error('Failed to fetch experience data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Use experienceData if available (from API), otherwise use formData (from context)
  const displayData = experienceData || formData;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
        // Add to wishlist
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
        // Remove from wishlist
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

  const openPhotoModal = (imageIndex) => {
    setSelectedImage(imageIndex);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
  };

  const nextPhoto = () => {
    setSelectedImage((prev) => (prev + 1) % displayImages.length);
  };

  const prevPhoto = () => {
    setSelectedImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // Keyboard support for photo modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showPhotoModal) {
        switch(event.key) {
          case 'Escape':
            closePhotoModal();
            break;
          case 'ArrowLeft':
            prevPhoto();
            break;
          case 'ArrowRight':
            nextPhoto();
            break;
        }
      }
      if (showAllSchedules && event.key === 'Escape') {
        setShowAllSchedules(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPhotoModal, showAllSchedules]);


  // Build images array from media data (includes cover photo) or fallback to form data
  const images = mediaData && mediaData.length > 0
    ? mediaData.map(media => media.mediaUrl)
    : [
        displayData.coverPhotoUrl,
        ...(displayData.additionalPhotos || [])
      ].filter(Boolean);
  
  // Fallback images if no form data
  const fallbackImages = [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop'
  ];
  
  const displayImages = images.length > 0 ? images : fallbackImages;

  let highlightsArray;
  if (Array.isArray(displayData.highlights)) {
    // Backend returned an array
    highlightsArray = displayData.highlights.length > 0 ? displayData.highlights : [
      'Explore local eateries and street food culture',
      'Try 15 different dishes across 4 authentic venues',
      'Expert local guide with insider knowledge',
      'Small group experience (max 8 people)',
      'Vegetarian and dietary restrictions accommodated'
    ];
  } else if (typeof displayData.highlights === 'string' && displayData.highlights.trim()) {
    // Backend returned a string - split by comma
    highlightsArray = displayData.highlights.split(',').filter(h => h.trim());
  } else {
    // Fallback for null/undefined/empty
    highlightsArray = [
      'Explore local eateries and street food culture',
      'Try 15 different dishes across 4 authentic venues',
      'Expert local guide with insider knowledge',
      'Small group experience (max 8 people)',
      'Vegetarian and dietary restrictions accommodated'
    ];
  }

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

  // Show loading state when fetching from API
  if (loading && id) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-neutrals-2">Loading experience...</div>
        </div>
      </div>
    );
  }
  
  // Show error state if fetch failed
  if (error && id) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600">Error loading experience</div>
          <p className="text-neutrals-3 mt-2">{error}</p>
          <button 
            onClick={fetchExperience}
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
          
          {/* Main Content */}
          <div className="flex-1" style={{ paddingTop: '40px', paddingBottom: '100px' }}>
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-10">
            {/* Title and Actions */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex-1 max-w-4xl">
                {/* Category Badge */}
                {displayData.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-1 text-white shadow-sm">
                      {getCategoryDisplayName(displayData.category)}
                    </span>
                  </div>
                )}
                
                <h1 className="text-5xl font-bold text-neutrals-2 leading-tight mb-4 break-words" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.96px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {displayData.title || 'Experience Title'}
                </h1>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-neutrals-2 font-medium text-sm">{displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '4.8'}</span>
                    </div>
                    <span className="text-neutrals-4 text-sm">({displayData.totalReviews|| 256} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-neutrals-4 text-sm">{displayData.country || 'Country not specified'}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                
                <button className="p-2 border-2 border-neutrals-6 rounded-full hover:bg-neutrals-7 transition-colors">
                  <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button className="p-2 border-2 border-neutrals-6 rounded-full hover:bg-neutrals-7 transition-colors">
                  <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button> 
                <button 
                  onClick={handleWishlistToggle}
                  className={`p-2 border-2 border-neutrals-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isWishlisted ? 'bg-red-50 animate-pulse' : 'bg-neutrals-8 hover:bg-neutrals-7'
                  }`}
                >
                  <svg 
                    className="w-6 h-6 transition-all duration-300" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      fill={isWishlisted ? "#FD7FE9" : "#B1B5C3"}
                      className="transition-colors duration-300"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="grid gap-4 mb-5 max-w-full" style={{ height: '450px', maxHeight: '450px' }}>
              {displayImages.length === 1 && (
                <div className="rounded-2xl overflow-hidden h-full">
                  <img 
                    src={displayImages[0]} 
                    alt="Experience image 1" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => openPhotoModal(0)}
                  />
                </div>
              )}
              {displayImages.length === 2 && (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      src={displayImages[0]} 
                      alt="Experience image 1" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(0)}
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      src={displayImages[1]} 
                      alt="Experience image 2" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(1)}
                    />
                  </div>
                </div>
              )}
              {displayImages.length === 3 && (
                <div className="grid grid-cols-3 gap-4 h-full">
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      src={displayImages[0]} 
                      alt="Experience image 1" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(0)}
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      src={displayImages[1]} 
                      alt="Experience image 2" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(1)}
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      src={displayImages[2]} 
                      alt="Experience image 3" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(2)}
                    />
                  </div>
                </div>
              )}
              {displayImages.length >= 4 && (
                <div className="grid grid-cols-4 gap-4 h-full">
                  <div className="col-span-1 rounded-2xl overflow-hidden">
                    <img 
                      src={displayImages[0]} 
                      alt="Experience image 1" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(0)}
                    />
                  </div>
                  <div className="col-span-2 rounded-2xl overflow-hidden relative">
                    <img 
                      src={displayImages[1]} 
                      alt="Experience image 2" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => openPhotoModal(1)}
                    />
                  </div>
                  <div className="col-span-1 flex flex-col gap-4">
                    <div className="h-[217px] rounded-2xl overflow-hidden">
                      <img 
                        src={displayImages[2]} 
                        alt="Experience image 3" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => openPhotoModal(2)}
                      />
                    </div>
                    <div className="h-[217px] rounded-2xl overflow-hidden relative">
                      <img 
                        src={displayImages[3]} 
                        alt="Experience image 4" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => openPhotoModal(3)}
                      />
                      {displayImages.length > 4 && (
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-colors"
                          onClick={() => openPhotoModal(3)}
                        >
                          <span className="text-white text-2xl font-bold">+{displayImages.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Short Description Caption */}
            {(displayData.shortDescription) && (
              <div className="mb-8">
                <p className="text-neutrals-3 text-lg leading-relaxed break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {displayData.shortDescription}
                </p>
              </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-12 min-w-0">
              {/* Left Column - Tour Details */}
              <div className="col-span-2 space-y-8 min-w-0 overflow-hidden">
                {/* Highlights */}
                <div>
                  <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                    Highlights
                  </h2>
                  <ul className="space-y-3">
                    {highlightsArray.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-neutrals-3 break-words" style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full Description */}
                <div>
                  <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                    Full Description
                  </h2>
                  <p className="text-neutrals-3 leading-relaxed break-words" style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {displayData.fullDescription || displayData.shortDescription || 'This is a sample experience page. To see real data, please go through the Create Experience flow: Basic Info → Details → Pricing → Availability → Success → View Experience.'}
                  </p>
                </div>


                {/* Itinerary */}
                {itinerariesData && itinerariesData.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                      Itinerary
                    </h2>
                    <div className="bg-neutrals-7 rounded-2xl p-6">
                      <div className="space-y-6" style={{padding: '10px'}}>
                        {itinerariesData.map((item, index) => (
                          <div key={index} className="relative">
                            <div className="flex items-start gap-5">
                              <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                  item.stopType === 'start' ? 'bg-green-500' :
                                  item.stopType === 'end' ? 'bg-red-500' : 'bg-blue-500'
                                }`}>
                                  {item.stopType === 'start' ? 'START' : 
                                   item.stopType === 'end' ? 'END' : index}
                                </div>
                                {index < itinerariesData.length - 1 && (
                                  <div className="w-1 h-20 bg-neutrals-5 mt-3 rounded-full"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                  <MapPin className="w-5 h-5 text-neutrals-4" />
                                  <span className="text-lg font-semibold text-neutrals-1">
                                    {item.locationName || 'Location'}
                                  </span>
                                </div>
                                
                                {item.stopType !== 'start' && item.stopType !== 'end' && (
                                  <div className="flex items-center gap-3 text-sm text-neutrals-3">
                                    <Clock className="w-4 h-4 text-neutrals-4" />
                                    <span>{item.duration || 'Duration not specified'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* What's Included */}
                <div>
                  <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                    What's included
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {displayData.whatIncluded ? (
                      displayData.whatIncluded.split(',').filter(item => item.trim()).map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-neutrals-3 text-sm break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{item.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-neutrals-3 text-sm">Food tastings</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-neutrals-3 text-sm">Expert guide</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Meeting Point */}
                <div>
                  <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                    Meeting Point
                  </h2>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-1 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-neutrals-2 font-medium mb-1">{displayData.location || 'Meeting location will be provided after booking'}</p>
                      <p className="text-neutrals-4 text-sm">Exact meeting instructions will be sent via email after booking confirmation.</p>
                    </div>
                  </div>
                </div>

                {/* Important Info */}
                {displayData.importantInfo && (
                  <div>
                    <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                      Important Information
                    </h2>
                    <div className="bg-neutrals-7 rounded-lg p-4">
                      <FormattedImportantInfo text={displayData.importantInfo} isMobile={false} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Booking Card */}
              <div className="col-span-1">
                <div className="bg-white border border-neutrals-6 rounded-2xl p-6 shadow-lg">
                  {/* Price Section */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-3xl font-bold text-neutrals-2">${displayData.price || '89'}</span>
                      <span className="text-sm text-neutrals-4">/person</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-neutrals-2">{displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '4.8'}</span>
                      <span className="text-sm text-neutrals-4">({displayData.totalReviews || 256} reviews)</span>
                    </div>
                    
                    {/* Duration Display */}
                    {formatDuration(displayData, schedulesData) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-neutrals-4" />
                        <span className="text-sm text-neutrals-4">
                          {formatDuration(displayData, schedulesData)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Available Schedules */}
                  <div className="space-y-3 mb-4">
                    {schedulesData && schedulesData.length > 0 ? (
                      schedulesData.slice(0, 5).map((schedule, index) => (
                        <div 
                          key={index} 
                          className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${
                            selectedSchedule === index 
                              ? 'border-primary-1 bg-primary-1' 
                              : 'border-neutrals-6 hover:border-primary-1'
                          }`}
                          onClick={() => setSelectedSchedule(index)}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <div>
                              {(() => {
                                const formattedSchedule = formatScheduleDisplay(schedule);
                                return (
                                  <>
                                    <div className={`font-semibold ${selectedSchedule === index ? 'text-white' : 'text-neutrals-2'}`}>
                                      {formattedSchedule.dateText}
                                    </div>
                                    <div className={`text-sm ${selectedSchedule === index ? 'text-white opacity-90' : 'text-neutrals-4'}`}>
                                      {formattedSchedule.timeText}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <div className={`text-sm ${selectedSchedule === index ? 'text-white opacity-90' : 'text-neutrals-4'}`}>
                              {schedule.availableSpots || 4} spots available
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback demo schedules
                      <>
                        <div 
                          className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${
                            selectedSchedule === 'demo-0' 
                              ? 'border-primary-1 bg-primary-1' 
                              : 'border-neutrals-6 hover:border-primary-1'
                          }`}
                          onClick={() => setSelectedSchedule('demo-0')}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <div>
                              <div className={`font-semibold ${selectedSchedule === 'demo-0' ? 'text-white' : 'text-neutrals-2'}`}>Sunday, 5 October</div>
                              <div className={`text-sm ${selectedSchedule === 'demo-0' ? 'text-white opacity-90' : 'text-neutrals-4'}`}>10:00 am - 3:30 pm</div>
                            </div>
                            <div className={`text-sm ${selectedSchedule === 'demo-0' ? 'text-white opacity-90' : 'text-neutrals-4'}`}>4 spots available</div>
                          </div>
                        </div>
                        <div 
                          className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${
                            selectedSchedule === 'demo-1' 
                              ? 'border-primary-1 bg-primary-1' 
                              : 'border-neutrals-6 hover:border-primary-1'
                          }`}
                          onClick={() => setSelectedSchedule('demo-1')}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <div>
                              <div className={`font-semibold ${selectedSchedule === 'demo-1' ? 'text-white' : 'text-neutrals-2'}`}>Monday, 6 October</div>
                              <div className={`text-sm ${selectedSchedule === 'demo-1' ? 'text-white opacity-90' : 'text-neutrals-4'}`}>10:00 am - 3:30 pm</div>
                            </div>
                            <div className={`text-sm ${selectedSchedule === 'demo-1' ? 'text-white opacity-90' : 'text-neutrals-4'}`}>4 spots available</div>
                          </div>
                        </div>
                        <div 
                          className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${
                            selectedSchedule === 'demo-2' 
                              ? 'border-primary-1 bg-primary-1' 
                              : 'border-neutrals-6 hover:border-primary-1'
                          }`}
                          onClick={() => setSelectedSchedule('demo-2')}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <div>
                              <div className={`font-semibold ${selectedSchedule === 'demo-2' ? 'text-white' : 'text-neutrals-2'}`}>Tuesday, 7 October</div>
                              <div className={`text-sm ${selectedSchedule === 'demo-2' ? 'text-white opacity-90' : 'text-neutrals-4'}`}>10:00 am - 3:30 pm</div>
                            </div>
                            <div className={`text-sm ${selectedSchedule === 'demo-2' ? 'text-white opacity-90' : 'text-neutrals-4'}`}>4 spots available</div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Show All Dates Link */}
                    <button 
                      className="w-full text-center text-neutrals-4 hover:text-primary-1 transition-colors py-2 text-sm font-medium"
                      onClick={() => setShowAllSchedules(true)}
                    >
                      Show all dates
                    </button>
                  </div>

                  {/* Guest Selection */}
                  <div className="mb-6 border-t border-neutrals-6 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-neutrals-2">Guests</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="w-8 h-8 rounded-full border border-neutrals-6 flex items-center justify-center hover:bg-neutrals-7 disabled:opacity-50"
                          disabled={guests <= 1}
                        >
                          <span className="text-neutrals-2">-</span>
                        </button>
                        <span className="text-neutrals-2 min-w-[2rem] text-center">{guests}</span>
                        <button 
                          onClick={() => setGuests(Math.min((displayData.participantsAllowed || 8), guests + 1))}
                          className="w-8 h-8 rounded-full border border-neutrals-6 flex items-center justify-center hover:bg-neutrals-7 disabled:opacity-50"
                          disabled={guests >= (displayData.participantsAllowed || 8)}
                        >
                          <span className="text-neutrals-2">+</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Book Now Button */}
                  <button className="w-full bg-primary-1 text-white py-3 rounded-full font-bold hover:bg-opacity-90 transition-colors mb-4" style={{ fontFamily: 'DM Sans' }}>
                    Book Now
                  </button>

                  {/* Standardized Cancellation Policy */}
                  <div className="text-center text-xs text-neutrals-4 mb-4">
                    <div className="space-y-1">
                      <p><strong>Free Cancellation:</strong> 24 hours after purchase</p>
                      <p><strong>7+ days before:</strong> Full refund (minus service fee)</p>
                      <p><strong>3-6 days before:</strong> 50% refund</p>
                      <p><strong>Less than 48 hours:</strong> Non-refundable</p>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t border-neutrals-6 pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutrals-4">${displayData.price || '89'} x {guests} guests</span>
                        <span className="text-neutrals-2">${((displayData.price || 89) * guests)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutrals-4">Service fee</span>
                        <span className="text-neutrals-2">${Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
                      </div>
                      <div className="border-t border-neutrals-6 pt-2 flex justify-between font-semibold">
                        <span className="text-neutrals-2">Total</span>
                        <span className="text-neutrals-2">${((displayData.price || 89) * guests) + Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
          <div className="max-w-7xl mx-auto px-10 mt-16">
              <h2 className="text-2xl font-semibold text-neutrals-2 mb-8" style={{ fontFamily: 'Poppins' }}>
                About your host
              </h2>
              <div className="bg-white border border-neutrals-6 rounded-2xl p-8">
                <div className="flex items-start gap-6">
                  {/* Host Profile Photo */}
                  <div 
                    className="cursor-pointer group"
                    onClick={handleGuideProfileClick}
                    title="View guide profile"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-neutrals-6 group-hover:opacity-90 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
                      {displayData.guide && displayData.guide.profileImageUrl ? (
                        <img 
                          src={displayData.guide.profileImageUrl} 
                          alt={getGuideFullName(displayData.guide)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-1 to-primary-2 flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">
                            {getGuideInitials(displayData.guide)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-neutrals-1" style={{ fontFamily: 'DM Sans' }}>
                        {getGuideFullName(displayData.guide)}
                      </h3>
                      {/* Verification Badge */}
                      <div className="w-7 h-7 bg-primary-1 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-8 mb-6">
                    <div>
                      <div className="text-2xl font-bold text-neutrals-1">{displayData.totalReviews || 223}</div>
                      <div className="text-neutrals-4 text-sm">Reviews</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-neutrals-1">{displayData.averageRating ? Number(displayData.averageRating).toFixed(2) : '4.87'}</span>
                        <svg className="w-5 h-5 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="text-neutrals-4 text-sm">Rating</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-neutrals-1">1</div>
                      <div className="text-neutrals-4 text-sm">Year hosting</div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <div className="text-neutrals-3 text-sm font-medium mb-2">Languages</div>
                    <div className="flex flex-wrap gap-2">
                      {['English', 'Mandarin', 'Malay'].map((language) => (
                        <span key={language} className="px-3 py-1 bg-neutrals-7 text-neutrals-2 text-sm rounded-full">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Tours */}
          <div className="max-w-7xl mx-auto px-10 mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-neutrals-4 text-xs uppercase font-bold mb-2" style={{ fontFamily: 'Poppins' }}>The perfect trip</p>
                <h2 className="text-5xl font-bold text-neutrals-2" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.96px' }}>
                  You may interested in
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

            <div className="grid grid-cols-4 gap-8">
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

          </div>

          <Footer />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={true}
          variant="mobile"
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        
        {/* Mobile Content */}
        <div className="flex-1 min-h-screen" style={{ paddingTop: '20px', paddingBottom: '60px', paddingLeft: '16px', paddingRight: '16px' }}>
          {/* Mobile Hero */}
          <div className="mb-6">
            {/* Category Badge - Mobile */}
            {displayData.category && (
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-1 text-white shadow-sm">
                  {getCategoryDisplayName(displayData.category)}
                </span>
              </div>
            )}
            
            <h1 className="text-2xl font-bold text-neutrals-2 leading-tight mb-3 break-words" style={{ fontFamily: 'DM Sans', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {displayData.title || 'Experience Title'}
            </h1>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-neutrals-2 font-medium text-sm">{displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '4.8'}</span>
              </div>
              <span className="text-neutrals-4 text-sm">({displayData.totalReviews || 256} reviews)</span>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-neutrals-3 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {displayData.country || 'Country not specified'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 border border-neutrals-6 rounded-full bg-white shadow-sm hover:bg-neutrals-7 transition-colors">
                  <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button className="p-2 border border-neutrals-6 rounded-full bg-white shadow-sm hover:bg-neutrals-7 transition-colors">
                  <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button> 
                <button 
                  onClick={handleWishlistToggle}
                  className={`p-2 border border-neutrals-6 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isWishlisted ? 'bg-red-50' : 'bg-white hover:bg-neutrals-7'
                  }`}
                >
                  <svg 
                    className="w-5 h-5 transition-all duration-300" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      fill={isWishlisted ? "#FD7FE9" : "#B1B5C3"}
                      className="transition-colors duration-300"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Images */}
          <div className="mb-6">
            {/* Main Image */}
            <div className="rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: '16/10' }}>
              <img 
                src={displayImages[0]} 
                alt="Experience image 1" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openPhotoModal(0)}
              />
            </div>
            
            {/* Additional Images Grid */}
            {displayImages.length > 1 && (
              <div className={`grid gap-2 ${
                displayImages.length === 2 ? 'grid-cols-1' :
                displayImages.length === 3 ? 'grid-cols-2' : 
                'grid-cols-3'
              }`}>
                {displayImages.slice(1, displayImages.length >= 4 ? 4 : displayImages.length).map((image, index) => (
                  <div key={index + 1} className="rounded-lg overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                    <img 
                      src={image} 
                      alt={`Experience image ${index + 2}`} 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openPhotoModal(index + 1)}
                    />
                    {index === 2 && displayImages.length > 4 && (
                      <button 
                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"
                        onClick={() => openPhotoModal(index + 1)}
                      >
                        <span className="text-white text-xs font-bold">+{displayImages.length - 4}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Short Description */}
          {displayData.shortDescription && (
            <div className="mb-6">
              <p className="text-neutrals-3 text-sm leading-relaxed break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {displayData.shortDescription}
              </p>
            </div>
          )}


          {/* Mobile Content */}
          <div className="space-y-6">
            {/* Highlights */}
            <div>
              <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
                Highlights
              </h2>
              <ul className="space-y-2">
                {highlightsArray.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-neutrals-3 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Full Description */}
            <div>
              <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
                Full Description
              </h2>
              <p className="text-neutrals-3 text-sm leading-relaxed break-words" style={{ fontFamily: 'Poppins', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {displayData.fullDescription || displayData.shortDescription || 'This is a sample experience page. To see real data, please go through the Create Experience flow: Basic Info → Details → Pricing → Availability → Success → View Experience.'}
              </p>
            </div>

            {/* Mobile Itinerary */}
            {itinerariesData && itinerariesData.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
                  Itinerary
                </h2>
                <div className="bg-neutrals-7 rounded-lg p-4">
                  <div className="space-y-4">
                    {itinerariesData.map((item, index) => (
                      <div key={index} className="relative">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              item.stopType === 'start' ? 'bg-green-500' :
                              item.stopType === 'end' ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                              {item.stopType === 'start' ? 'ST' : 
                               item.stopType === 'end' ? 'END' : index}
                            </div>
                            {index < itinerariesData.length - 1 && (
                              <div className="w-0.5 h-16 bg-neutrals-5 mt-2 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className="text-sm font-medium text-neutrals-2 mb-1">{item.locationName}</h4>
                            {item.stopType !== 'start' && item.stopType !== 'end' && (
                              <p className="text-xs text-neutrals-4 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{item.duration || 'Duration not specified'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* What's Included */}
            <div>
              <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
                What's Included
              </h2>
              <div className="text-neutrals-3 text-sm space-y-2">
                {(displayData.whatIncluded || 'Food tastings, Expert guide, Cultural insights, Small group experience').split(', ').map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Meeting Point */}
            <div>
              <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
                Meeting Point
              </h2>
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-primary-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-neutrals-2 font-medium mb-1 text-sm">{displayData.location || 'Meeting location will be provided after booking'}</p>
                  <p className="text-neutrals-4 text-xs">Exact meeting instructions will be sent via email after booking confirmation.</p>
                </div>
              </div>
            </div>

            {/* Important Information */}
            {displayData.importantInfo && (
            <div>
              <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
                Important Information
              </h2>
              <div className="bg-neutrals-7 rounded-lg p-4">
                <FormattedImportantInfo text={displayData.importantInfo} isMobile={true} />
              </div>
            </div>
            )}

            {/* Mobile Booking Section */}
            <div className="bg-white border border-neutrals-6 rounded-2xl p-4 shadow-lg">
              {/* Price Section */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-neutrals-2">${displayData.price || '89'}</span>
                  <span className="text-xs text-neutrals-4">/person</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-semibold text-neutrals-2">{displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '4.8'}</span>
                  <span className="text-xs text-neutrals-4">({displayData.totalReviews || 256} reviews)</span>
                </div>
                
                {/* Duration Display - Mobile */}
                {formatDuration(displayData, schedulesData) && (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-neutrals-4" />
                    <span className="text-xs text-neutrals-4">
                      {formatDuration(displayData, schedulesData)}
                    </span>
                  </div>
                )}
              </div>

              {/* Available Schedules */}
              <div className="space-y-2 mb-4">
                {schedulesData && schedulesData.length > 0 ? (
                  schedulesData.slice(0, 3).map((schedule, index) => (
                    <div 
                      key={index} 
                      className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${
                        selectedSchedule === index 
                          ? 'border-primary-1 bg-primary-1' 
                          : 'border-neutrals-6 hover:border-primary-1'
                      }`}
                      onClick={() => setSelectedSchedule(selectedSchedule === index ? null : index)}
                    >
                      {selectedSchedule === index && (
                        <div className="absolute inset-0 bg-primary-1 rounded-lg"></div>
                      )}
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          {(() => {
                            const formattedSchedule = formatScheduleDisplay(schedule);
                            return (
                              <>
                                <div className={`font-semibold text-xs ${selectedSchedule === index ? 'text-white' : 'text-neutrals-2'}`}>
                                  {formattedSchedule.dateText}
                                </div>
                                <div className={`text-xs ${selectedSchedule === index ? 'text-white opacity-90' : 'text-neutrals-4'}`}>
                                  {formattedSchedule.timeText}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div className={`text-xs ${selectedSchedule === index ? 'text-white opacity-90' : 'text-neutrals-4'}`}>
                          {schedule.availableSpots || 4} spots available
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback demo schedules for mobile
                  <>
                    <div 
                      className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${
                        selectedSchedule === 0 
                          ? 'border-primary-1 bg-primary-1' 
                          : 'border-neutrals-6 hover:border-primary-1'
                      }`}
                      onClick={() => setSelectedSchedule(selectedSchedule === 0 ? null : 0)}
                    >
                      {selectedSchedule === 0 && (
                        <div className="absolute inset-0 bg-primary-1 rounded-lg"></div>
                      )}
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <div className={`font-semibold text-xs ${selectedSchedule === 0 ? 'text-white' : 'text-neutrals-2'}`}>Saturday, 5 October</div>
                          <div className={`text-xs ${selectedSchedule === 0 ? 'text-white opacity-90' : 'text-neutrals-4'}`}>10:00 AM - 3:30 PM</div>
                        </div>
                        <div className={`text-xs ${selectedSchedule === 0 ? 'text-white opacity-90' : 'text-neutrals-4'}`}>4 spots available</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Show All Dates Link */}
              <button 
                className="w-full text-center text-neutrals-4 hover:text-primary-1 transition-colors py-2 text-xs font-medium"
                onClick={() => setShowAllSchedules(true)}
              >
                Show all dates
              </button>

              {/* Guest Selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-neutrals-2 mb-2">Guests</label>
                <div className="flex items-center justify-between border border-neutrals-6 rounded-lg px-3 py-2">
                  <button 
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-6 h-6 rounded-full border border-neutrals-5 flex items-center justify-center hover:bg-neutrals-7 transition-colors"
                  >
                    <span className="text-neutrals-3">-</span>
                  </button>
                  <span className="text-sm font-medium text-neutrals-2">{guests} guests</span>
                  <button 
                    onClick={() => setGuests(guests + 1)}
                    className="w-6 h-6 rounded-full border border-neutrals-5 flex items-center justify-center hover:bg-neutrals-7 transition-colors"
                  >
                    <span className="text-neutrals-3">+</span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mb-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutrals-4">${displayData.price || '89'} x {guests} guests</span>
                    <span className="text-neutrals-2">${((displayData.price || 89) * guests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutrals-4">Service fee</span>
                    <span className="text-neutrals-2">${Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
                  </div>
                  <div className="border-t border-neutrals-6 pt-2 flex justify-between font-semibold">
                    <span className="text-neutrals-2">Total</span>
                    <span className="text-neutrals-2">${((displayData.price || 89) * guests) + Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
                  </div>
                </div>
              </div>

              {/* Book Now Button */}
              <button 
                className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${
                  selectedSchedule !== null 
                    ? 'bg-primary-1 text-white hover:opacity-90' 
                    : 'bg-neutrals-5 text-neutrals-4 cursor-not-allowed'
                }`}
                disabled={selectedSchedule === null}
              >
                {selectedSchedule !== null ? 'Book Now' : 'Select a date to book'}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>Reviews</h2>
              <div className="flex items-center gap-3 mb-4">
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
                <span className="text-neutrals-4 text-xs">Based on {displayData.totalReviews || 256} reviews</span>
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="border-b border-neutrals-6 pb-4">
                    <div className="flex gap-3">
                      <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-neutrals-2">{review.name}</span>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <svg key={i} className="w-3 h-3 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-neutrals-3 leading-relaxed break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile About your host */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
                  About your host
                </h2>
                <div className="bg-white border border-neutrals-6 rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    {/* Mobile Host Profile Photo */}
                    <div 
                      className="cursor-pointer group"
                      onClick={handleGuideProfileClick}
                      title="View guide profile"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-neutrals-6 group-hover:opacity-90 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg">
                        {displayData.guide && displayData.guide.profileImageUrl ? (
                          <img 
                            src={displayData.guide.profileImageUrl} 
                            alt={getGuideFullName(displayData.guide)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-1 to-primary-2 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {getGuideInitials(displayData.guide)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Host Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-neutrals-1" style={{ fontFamily: 'DM Sans' }}>
                          {getGuideFullName(displayData.guide)}
                        </h3>
                        {/* Mobile Verification Badge */}
                        <div className="w-5 h-5 bg-primary-1 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Mobile Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutrals-1">{displayData.totalReviews || 223}</div>
                    <div className="text-neutrals-4 text-xs">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-neutrals-1">{displayData.averageRating ? Number(displayData.averageRating).toFixed(2) : '4.87'}</span>
                      <svg className="w-4 h-4 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="text-neutrals-4 text-xs">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutrals-1">1</div>
                    <div className="text-neutrals-4 text-xs">Year hosting</div>
                  </div>
                </div>

                {/* Mobile Languages */}
                <div>
                  <div className="text-neutrals-3 text-xs font-medium mb-2">Languages</div>
                  <div className="flex flex-wrap gap-2">
                    {['English', 'Mandarin', 'Malay'].map((language) => (
                      <span key={language} className="px-2 py-1 bg-neutrals-7 text-neutrals-2 text-xs rounded-full">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile You May Be Interested */}
            <div className="mt-8">
              <div className="mb-6">
                <p className="text-neutrals-4 text-xs uppercase font-bold mb-2" style={{ fontFamily: 'Poppins' }}>The perfect trip</p>
                <h2 className="text-2xl font-bold text-neutrals-2" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.96px' }}>
                  You may interested in
                </h2>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {relatedTours.map((tour) => (
                  <div key={tour.id} className="bg-neutrals-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 w-64">
                    <div className="relative h-32">
                      <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                      <button className="absolute top-3 right-3 p-2 bg-neutrals-8 rounded-full shadow-lg">
                        <svg className="w-4 h-4 text-primary-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutrals-4 font-medium">{tour.location}</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-neutrals-2 font-medium text-xs">{tour.rating}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-neutrals-2 mb-2 line-clamp-2 leading-tight">
                        {tour.title}
                      </h3>
                      <p className="text-xs text-neutrals-4 mb-3">{tour.dates}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutrals-4 line-through">${tour.originalPrice}</span>
                          <span className="text-sm font-bold text-neutrals-2">${tour.price}</span>
                          <span className="text-xs text-neutrals-4">/person</span>
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
      
      {/* Photo Lightbox Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button 
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Previous Button */}
            {displayImages.length > 1 && (
              <button 
                onClick={prevPhoto}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Next Button */}
            {displayImages.length > 1 && (
              <button 
                onClick={nextPhoto}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {/* Image */}
            <img 
              src={displayImages[selectedImage]} 
              alt={`Experience image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Image Counter */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                {selectedImage + 1} of {displayImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceDetailsPage;