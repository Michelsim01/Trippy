import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProfileCard, { UserRole } from '../components/profile/ProfileCard';
import IntroductionTab from '../components/profile/IntroductionTab';
import TourListTab from '../components/profile/TourListTab';
import ReviewsTab from '../components/profile/ReviewsTab';
import MyReviewsTab from '../components/profile/MyReviewsTab';
import BlogsTab from '../components/profile/BlogsTab';

const ProfilePage = () => {
    const { id } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Introduction');
    const [currentRole, setCurrentRole] = useState(UserRole.TOURIST);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const fetchUserData = async (userId) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/users/${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setUserData(data);
            
            // Set user role based on KYC verification status
            if (data.canCreateExperiences && data.kycStatus === 'APPROVED') {
                setCurrentRole(UserRole.TOUR_GUIDE);
            } else {
                setCurrentRole(UserRole.TOURIST);
            }
            
            setError(null);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchUserData(id);
        }
    }, [id]);

    const isTourGuide = currentRole === UserRole.TOUR_GUIDE;
    const userName = userData?.firstName || (isTourGuide ? 'Farley' : 'Sarah');
    const backgroundImage = isTourGuide
        ? "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        : "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

    const tabs = isTourGuide 
        ? ['Introduction', 'Tour list', 'Reviews', 'Blogs']
        : ['Introduction', 'My reviews'];

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

    const touristReviews = [
        {
            id: 1,
            tourGuide: 'Farley',
            tourName: 'Venice, Rome & Milan Tour',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            rating: 5,
            comment: 'Amazing tour! Farley was incredibly knowledgeable and made the history come alive. Highly recommend!',
            timeAgo: '2 weeks ago'
        },
        {
            id: 2,
            tourGuide: 'Marco',
            tourName: 'Florence Art & Culture Tour',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            rating: 4,
            comment: 'Great insights into Renaissance art. Marco really knows his stuff!',
            timeAgo: '1 month ago'
        },
        {
            id: 3,
            tourGuide: 'Sofia',
            tourName: 'Barcelona Food Tour',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c27d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            rating: 5,
            comment: 'Best food tour ever! Sofia took us to amazing local spots that tourists never find.',
            timeAgo: '2 months ago'
        }
    ];

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
                return <IntroductionTab userData={userData} userName={userName} isTourGuide={isTourGuide} />;
            case 'Tour list':
                return <TourListTab tourData={tourData} />;
            case 'Reviews':
                return <ReviewsTab reviews={reviews} />;
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
            {loading && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                        <p className="text-neutrals-3">Loading profile...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button 
                            onClick={() => fetchUserData(id)}
                            className="btn btn-primary"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content - Only show when data is loaded */}
            {!loading && !error && userData && (
                <>
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
                                        <ProfileCard userId={id} className="max-w-none" />
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
                    isAuthenticated={true}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                
                <main className="w-full p-4">
                    {/* Mobile Profile Card */}
                    <div className="mb-6">
                        <ProfileCard userId={id} className="max-w-none" />
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