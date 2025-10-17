import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ExperienceCard from '../components/ExperienceCard';
import { useAuth } from '../contexts/AuthContext';
import { experienceApi } from '../services/experienceApi';

// Static images for UI elements (hero banner, etc.)
const heroImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
const experienceImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

const WelcomeBanner = () => {
    return (
        <div className="relative h-[500px] lg:h-[600px] overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroImage})` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
                <h1 className="text-[40px] lg:text-[56px] font-bold text-white mb-4 leading-tight tracking-[-0.4px] max-w-4xl">
                    Discover Hidden Local Gems
                </h1>
                <p className="text-[14px] lg:text-[16px] text-white/90 max-w-lg">
                    No more boring holidays. No more tourist traps.
                </p>
            </div>
        </div>
    );
};

const DiscoverWeekly = ({ experiences, wishlistItems, schedules, loading, error, selectedCategory, onCategoryChange, profileSummary }) => {
    const scrollContainerRef = useRef(null);

    // Use only real data from database
    const allExperiences = experiences || [];

    // Filter experiences by category
    const displayExperiences = selectedCategory === 'ALL'
        ? allExperiences
        : allExperiences.filter(exp => exp.category === selectedCategory);

    // Create a set of wishlisted experience IDs for quick lookup
    const wishlistedIds = new Set(wishlistItems.map(item => item.experienceId));

    return (
        <div className="bg-neutrals-8 py-10 px-8 w-full">
            <div className="w-full mx-auto flex flex-col items-center">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <h2 className="text-[32px] lg:text-[40px] font-bold text-neutrals-1 leading-[40px] lg:leading-[48px] tracking-[-0.32px] mb-5">
                        Discover Weekly
                    </h2>
                    <p className="text-[16px] text-neutrals-4 leading-[24px] mb-2">
                        For your Next Trip
                    </p>
                    {/* User Profile Summary */}
                    {!loading && !error && profileSummary && (
                        <p className="text-[14px] text-neutrals-3 leading-[20px] italic max-w-xl">
                            {profileSummary}
                        </p>
                    )}
                </div>

                {/* Filter */}
                <div className="flex items-center justify-center mb-10">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        {[
                            { value: 'ALL', label: 'All Experiences' },
                            { value: 'GUIDED_TOUR', label: 'Guided Tour' },
                            { value: 'DAYTRIP', label: 'Day Trip' },
                            { value: 'ADVENTURE', label: 'Adventure' },
                            { value: 'WORKSHOP', label: 'Workshop' },
                            { value: 'WATER_ACTIVITY', label: 'Water Activity' },
                            { value: 'OTHERS', label: 'Others' }
                        ].map((category) => (
                            <button
                                key={category.value}
                                onClick={() => onCategoryChange(category.value)}
                                className={`px-4 py-1.5 rounded-full transition-colors ${
                                    selectedCategory === category.value
                                        ? 'bg-neutrals-1 text-white'
                                        : 'text-neutrals-4 hover:text-neutrals-1'
                                }`}
                            >
                                <span className="text-[14px] font-bold">{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-600">Loading experiences...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-10 text-red-600">
                        <p className="text-lg font-semibold">Error loading experiences: {error.message}</p>
                        <p className="text-md text-gray-600">Please try refreshing the page.</p>
                    </div>
                )}

                {/* No Data State */}
                {!loading && !error && allExperiences.length === 0 && (
                    <div className="text-center py-10 text-gray-600">
                        <p className="text-lg">No experiences found.</p>
                        <p className="text-md">Check back later for new experiences!</p>
                    </div>
                )}

                {/* Desktop Grid (hidden on mobile) */}
                <div className="hidden lg:flex lg:flex-wrap lg:justify-center lg:gap-6 mb-10 w-full max-w-[1200px]">
                    {displayExperiences.map((experience) => (
                        <ExperienceCard
                            key={experience.experienceId || experience.id}
                            experience={experience}
                            showWishlistButton={true}
                            isInWishlist={wishlistedIds.has(experience.experienceId || experience.id)}
                            schedules={schedules[experience.experienceId] || []}
                        />
                    ))}
                </div>

                {/* Mobile Horizontal Scroll Carousel */}
                <div className="lg:hidden mb-10 w-full">
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto experience-carousel gap-6 p-4"
                    >
                        {displayExperiences.map((experience) => (
                            <ExperienceCard
                                key={experience.experienceId || experience.id}
                                experience={experience}
                                showWishlistButton={true}
                                isInWishlist={wishlistedIds.has(experience.experienceId || experience.id)}
                                schedules={schedules[experience.experienceId] || []}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HomePage = () => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [experiences, setExperiences] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [schedules, setSchedules] = useState({}); // Store schedules by experience ID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL'); // Add category state
    const [profileSummary, setProfileSummary] = useState(null); // User profile summary

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch personalized recommendations and wishlist items in parallel
                const [experiencesData, wishlistResponse] = await Promise.all([
                    experienceApi.getDiscoverWeeklyRecommendations(user?.userId || user?.id),
                    fetch(`http://localhost:8080/api/wishlist-items/user/${user?.userId || user?.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        credentials: 'include',
                    })
                ]);

                // Fetch profile summary (asynchronously, won't block page load)
                fetch(`http://localhost:8080/api/recommendations/profile-summary?userId=${user?.userId || user?.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include'
                })
                    .then(response => response.ok ? response.json() : null)
                    .then(data => {
                        if (data && data.summary) {
                            setProfileSummary(data.summary);
                        }
                    })
                    .catch(() => {
                        // Silently fail - profile summary is optional
                    });

                // Fetch schedule data for all experiences
                const schedulePromises = experiencesData.map(exp => 
                    experienceApi.getExperienceSchedules(exp.experienceId)
                        .catch(() => []) // If schedule fetch fails, use empty array
                );
                
                const schedulesData = await Promise.all(schedulePromises);
                
                // Create schedules object with experience ID as key
                const schedulesMap = {};
                experiencesData.forEach((exp, index) => {
                    schedulesMap[exp.experienceId] = schedulesData[index];
                });
                
                setSchedules(schedulesMap);
                
                // Add compatibility field
                experiencesData.forEach(exp => {
                    exp.id = exp.experienceId; // Add id field for compatibility
                });

                setExperiences(experiencesData);

                // Handle wishlist response
                if (wishlistResponse.ok) {
                    const wishlistData = await wishlistResponse.json();
                    const transformedWishlist = wishlistData.map(item => ({
                        experienceId: item.experience.experienceId,
                        wishlistItemId: item.wishlistItemId
                    }));
                    setWishlistItems(transformedWishlist);
                } else {
                    // If wishlist fails, just set empty array
                    setWishlistItems([]);
                }

                setError(null);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                console.error("Error details:", {
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                });
                setError(err);
                setExperiences([]); // Set empty array instead of fallback data
            } finally {
                setLoading(false);
            }
        };

        if ((user?.userId || user?.id) && isAuthenticated) {
            fetchData();
        } else if (!authLoading) {
            // If not authenticated and auth is done loading, set loading to false
            setLoading(false);
        }
    }, [user?.userId, user?.id, isAuthenticated, authLoading]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };


    // Show loading while authentication is being checked
    if (authLoading) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                    <p className="text-neutrals-4">Loading...</p>
                </div>
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-8">
                    <h1 className="text-3xl font-bold text-neutrals-1 mb-4">Welcome to Trippy</h1>
                    <p className="text-neutrals-4 mb-8">Please sign in to discover amazing experiences</p>
                    <a 
                        href="/signin" 
                        className="bg-primary-1 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-1/90 transition-colors inline-block"
                    >
                        Sign In
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutrals-8">
            {/* Desktop Layout */}
            <div className="hidden lg:flex">
                {/* Sidebar takes up layout space when open, none when closed */}
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
                </div>

                {/* Main content area */}
                <div className="flex-1 w-full transition-all duration-300">
                    <Navbar
                        isAuthenticated={true}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={toggleSidebar}
                    />
                    <main className="w-full">
                        <WelcomeBanner />
                        <DiscoverWeekly
                            experiences={experiences}
                            wishlistItems={wishlistItems}
                            schedules={schedules}
                            loading={loading}
                            error={error}
                            selectedCategory={selectedCategory}
                            onCategoryChange={handleCategoryChange}
                            profileSummary={profileSummary}
                        />
                        <div className="h-px bg-neutrals-6 w-full" />
                        <Footer />
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
                <main className="w-full">
                    <WelcomeBanner />
                    <DiscoverWeekly
                        experiences={experiences}
                        wishlistItems={wishlistItems}
                        schedules={schedules}
                        loading={loading}
                        error={error}
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                        profileSummary={profileSummary}
                    />
                    <div className="h-px bg-neutrals-6 w-full" />
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default HomePage;
