import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReviews } from '../contexts/ReviewContext';
import { reviewService } from '../services/reviewService';
import { userService } from '../services/userService';
import { experienceApi } from '../services/experienceApi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProfileCard, { UserRole } from '../components/profile/ProfileCard';
import IntroductionTab from '../components/profile/IntroductionTab';
import TourListTab from '../components/profile/TourListTab';
import ReviewsTab from '../components/profile/ReviewsTab';
import MyReviewsTab from '../components/profile/MyReviewsTab';
import TripPointsHistory from '../components/trippoints/TripPointsHistory'

const ProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
    const { userReviews } = useReviews();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Introduction');
    const [currentRole, setCurrentRole] = useState(UserRole.TOURIST);
    const [userData, setUserData] = useState(null);
    const [userExperiences, setUserExperiences] = useState([]);
    const [experiencesLoading, setExperiencesLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileUserReviews, setProfileUserReviews] = useState([]);
    const [error, setError] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [wishlistExperienceIds, setWishlistExperienceIds] = useState([]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const fetchUserData = async (userId) => { 
        try {
            setLoading(true);
            setError(null);
            
            if (!isAuthenticated || !token) {
                setError('You must be logged in to view profiles');
                setLoading(false);
                return;
            }
            
            const response = await userService.getUserById(userId);
            console.log('Fetched user data:', response);
            
            if (response.success) {
                setUserData(response.data);
                
                if (response.data.canCreateExperiences && response.data.kycStatus === 'APPROVED') {
                    setCurrentRole(UserRole.TOUR_GUIDE);
                } else {
                    setCurrentRole(UserRole.TOURIST);
                }
                
                setError(null);
            } else {
                if (response.status === 401) {
                    setError('Authentication required. Please log in again.');
                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                } else if (response.status === 404) {
                    navigate('/404');
                    return;
                } else {
                    setError(response.error || 'Failed to load user profile');
                }
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('An unexpected error occurred while loading the profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserExperiences = async (userId) => {
        try {
            setExperiencesLoading(true);
            const experiences = await experienceApi.getExperiencesByGuideId(userId);
            setUserExperiences(experiences);
        } catch (err) {
            console.error('Error fetching user experiences:', err);
            setUserExperiences([]);
        } finally {
            setExperiencesLoading(false);
        }
    };

    const fetchCurrentUserWishlist = async () => {
        // Fetch current user's wishlist to show heart highlights
        if (!user?.id) {
            console.log('ProfilePage - No user ID available for wishlist fetch');
            return;
        }

        try {
            console.log('ProfilePage - Fetching wishlist for user:', user.id);
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('ProfilePage - No auth token available');
                return;
            }

            const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('ProfilePage - Wishlist API response status:', response.status);

            if (response.ok) {
                const wishlistData = await response.json();
                console.log('ProfilePage - Raw wishlist data received:', wishlistData);

                if (Array.isArray(wishlistData)) {
                    const experienceIds = wishlistData.map(item => {
                        const id = item.experience?.experienceId || item.experienceId || item.id;
                        console.log('ProfilePage - Extracting experience ID:', id, 'from item:', item);
                        return id;
                    }).filter(id => id !== undefined);

                    console.log('ProfilePage - Final extracted experience IDs:', experienceIds);
                    setWishlistExperienceIds(experienceIds);
                } else {
                    console.error('ProfilePage - Wishlist data is not an array:', wishlistData);
                }
            } else {
                const errorText = await response.text();
                console.error('ProfilePage - Failed to fetch wishlist, status:', response.status, 'error:', errorText);
            }
        } catch (error) {
            console.error('ProfilePage - Error fetching wishlist:', error);
        }
    };

    const handleTourDeleted = (deletedTourId) => {
        // Remove the deleted tour from the userExperiences list
        setUserExperiences(prevExperiences =>
            prevExperiences.filter(experience =>
                experience.experienceId !== deletedTourId && experience.id !== deletedTourId
            )
        );
    };

    useEffect(() => {
        if (user && id) {
            const currentUserId = id?.toString();
            const profileId = user?.id?.toString();
            setIsOwnProfile(currentUserId === profileId);
        }
    }, [user, id]);

    useEffect(() => {
        if (authLoading) {
            return;
        }
        
        if (!isAuthenticated) {
            setError('You must be logged in to view profiles');
            setLoading(false);
            return;
        }
        if (id) {
            const numericId = parseInt(id, 10);
            if (isNaN(numericId) || numericId <= 0 || id !== numericId.toString()) {
                navigate('/404');
                return;
            }
            
            fetchUserData(id);
        } else {
            if (user?.id) {
                navigate(`/profile/${user.id}`);
            } else {
                setError('Unable to determine user profile');
                setLoading(false);
            }
        }
    }, [id, isAuthenticated, authLoading, user]);

    useEffect(() => {
        if (userData && currentRole === UserRole.TOUR_GUIDE && id) {
            fetchUserExperiences(id);
        }
    }, [userData, currentRole, id]);

    useEffect(() => {
        if (userData && user?.id) {
            console.log('ProfilePage - Triggering wishlist fetch, userData:', !!userData, 'user.id:', user.id, 'isOwnProfile:', isOwnProfile);
            fetchCurrentUserWishlist();
        }
    }, [userData, user?.id]);

    const isTourGuide = currentRole === UserRole.TOUR_GUIDE;
    const userName = userData?.firstName || (isTourGuide ? 'Farley' : 'Sarah');
    const backgroundImage = isTourGuide
        ? "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        : "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

    const tabs = isTourGuide 
        ? ['Introduction', 'Tour list', 'Reviews', 'TripPoints', 'Blogs']
        : ['Introduction', 'My reviews', 'TripPoints'];

    const tourData = [
        {
            id: 1,
            title: 'Venice, Rome & Milan',
            subtitle: 'ADVENTURE',
            price: '$549',
            rating: 4.5,
            duration: 'Jul 20 30 - Jul 30 20',
            image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        },
        {
            id: 2,
            title: 'Venice, Rome & Milan',
            subtitle: 'ADVENTURE',
            price: '$549',
            rating: 4.8,
            duration: 'Jul 20 30 - Jul 30 20',
            image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        },
        {
            id: 3,
            title: 'Venice, Rome & Milan',
            subtitle: 'ADVENTURE',
            price: '$549',
            rating: 5.0,
            duration: 'Jul 20 30 - Jul 30 20',
            image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        }
    ];

    const reviews = [
        {
            id: 1,
            name: 'Samson Heathcote',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            rating: 4,
            comment: 'We had the most spectacular view. Unfortunately, it was very hot in the room from 2-8pm pm due to no air conditioning and no shade.',
            timeAgo: 'about 1 hour ago',
            helpful: true
        },
        {
            id: 2,
            name: 'Samson Heathcote',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            rating: 4,
            comment: 'We had the most spectacular view. Unfortunately, it was very hot',
            timeAgo: 'about 1 hour ago',
            helpful: true
        },
        {
            id: 3,
            name: 'Samson Heathcote',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            rating: 4,
            comment: 'We had the most spectacular view. Unfortunately, it was very hot in the room from 2-8pm pm due to no air conditioning and no shade.',
            timeAgo: 'about 1 hour ago',
            helpful: true
        }
    ];

    // Load user reviews when component mounts or user changes
    useEffect(() => {
        if (id && isAuthenticated) {
            // Load reviews for the profile user, not the current logged-in user
            const loadProfileUserReviews = async () => {
                try {
                    const response = await reviewService.getUserReviews(parseInt(id));
                    if (response.success) {
                        setProfileUserReviews(response.data);
                    } else {
                        console.warn('Failed to load profile user reviews:', response.error);
                    }
                } catch (error) {
                    console.error('Error loading profile user reviews:', error);
                }
            };
            loadProfileUserReviews();
        }
    }, [id, isAuthenticated]);

    // Transform profileUserReviews to match MyReviewsTab expected format
    const touristReviews = profileUserReviews.map(review => ({
        id: review.reviewId,
        tourGuide: review.experience?.title || 'Unknown Experience',
        tourName: review.experience?.title || 'Unknown Tour',
        avatar: review.experience?.coverPhotoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        rating: review.rating,
        comment: review.comment,
        timeAgo: new Date(review.createdAt).toLocaleDateString(),
        tripPointsEarned: review.tripPointsEarned
    }));

    const blogs = [
        {
            id: 1,
            title: 'Convergent and divergent plate margins',
            author: 'Farley',
            date: '25 May, 2021',
            views: '160',
            image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        },
        {
            id: 2,
            title: 'Convergent and divergent plate margins',
            author: 'Farley',
            date: '25 May, 2021',
            views: '160',
            image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Introduction':
                return <IntroductionTab 
                    userData={userData} 
                    userName={userName} 
                    isTourGuide={isTourGuide} 
                    isOwnProfile={isOwnProfile}
                    onUserDataUpdate={setUserData}
                />;
            case 'Tour list':
                return <TourListTab
                    tourData={userExperiences}
                    loading={experiencesLoading}
                    isOwnProfile={isOwnProfile}
                    wishlistExperienceIds={wishlistExperienceIds}
                    onTourDeleted={handleTourDeleted}
                />;
            case 'Reviews':
                return <ReviewsTab reviews={reviews} />;
            case 'TripPoints':
                return (
                    <div className="space-y-6">
                        <TripPointsHistory userId={id} />
                    </div>
                );
            case 'My reviews':
                return <MyReviewsTab touristReviews={touristReviews} />;
            case 'Blogs':
                return <BlogsTab blogs={blogs} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-neutrals-8">
            {/* Loading State */}
            {(loading || authLoading) && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                        <p className="text-neutrals-3">
                            {authLoading ? 'Checking authentication...' : 'Loading profile...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && !authLoading && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        {!isAuthenticated ? (
                            <button 
                                onClick={() => navigate('/signin')}
                                className="btn btn-primary"
                            >
                                Sign In
                            </button>
                        ) : (
                            <button 
                                onClick={() => fetchUserData(id)}
                                className="btn btn-primary"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content - Only show when authenticated and data is loaded */}
            {!loading && !authLoading && !error && userData && isAuthenticated && (
                <>
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
                    {/* Profile Header with Background */}
                    <div className="relative">
                        <div 
                            className="h-64 bg-cover bg-center relative"
                            style={{ backgroundImage: `url(${backgroundImage})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
                        </div>
                    </div>
                    
                    <main className="w-full px-8 pb-8 pt-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Two Column Layout */}
                            <div className="flex gap-8">
                                {/* Left Column - Profile Card */}
                                <div className="w-80 flex-shrink-0">
                                    <div className="sticky top-24">
                                        <ProfileCard 
                                            userId={id} 
                                            userData={userData}
                                            isOwnProfile={isOwnProfile}
                                            className="max-w-none" 
                                        />
                                    </div>
                                </div>

                                {/* Right Column - Main Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Navigation Tabs */}
                                    <div className="border-b border-neutrals-6 mb-8">
                                        <nav className="flex space-x-2">
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveTab(tab)}
                                                    className={`${
                                                        activeTab === tab
                                                            ? 'btn btn-primary btn-sm'
                                                            : 'btn btn-ghost btn-sm'
                                                    } transition-all duration-300`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="bg-white rounded-2xl p-8 shadow-sm">
                                        {renderTabContent()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full">
                <Navbar
                    isAuthenticated={isAuthenticated}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                
                <main className="w-full p-4">
                    {/* Mobile Profile Card */}
                    <div className="mb-6">
                        <ProfileCard 
                            userId={id} 
                            userData={userData}
                            isOwnProfile={isOwnProfile}
                            className="max-w-none" 
                        />
                    </div>

                    {/* Mobile Tabs */}
                    <div className="border-b border-neutrals-6 mb-6 overflow-x-auto scrollbar-hide">
                        <nav className="flex space-x-2 min-w-max p-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`${
                                        activeTab === tab
                                            ? 'btn btn-primary btn-sm'
                                            : 'btn btn-ghost btn-sm'
                                    } whitespace-nowrap transition-all duration-300`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Mobile Tab Content */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
                </>
            )}
        </div>
    );
};

export default ProfilePage;