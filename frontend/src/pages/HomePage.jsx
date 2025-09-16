import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ExperienceCard from '../components/ExperienceCard';

// Mock images - in production these would come from your image assets
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

const DiscoverWeekly = ({ experiences, wishlistItems, schedules, loading, error, selectedCategory, onCategoryChange }) => {
    // Fallback dummy data in case API fails
    const fallbackExperiences = [
        { 
            experienceId: 1,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            price: 548, 
            rating: 4.9,
            imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "GUIDED_TOUR"
        },
        { 
            experienceId: 2,
            title: "Paris & Lyon Adventure", 
            location: "Franceville", 
            originalPrice: 799, 
            price: 629, 
            rating: 4.8,
            imageUrl: "https://images.unsplash.com/photo-1502602898669-a38738f73650?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "ADVENTURE"
        },
        { 
            experienceId: 3,
            title: "Tokyo City Explorer", 
            location: "Shibuya", 
            originalPrice: 899, 
            price: 749, 
            rating: 4.9,
            imageUrl: "https://images.unsplash.com/photo-1545892204-e37749721199?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "DAYTRIP"
        },
        { 
            experienceId: 4,
            title: "Barcelona Highlights", 
            location: "Catalunya", 
            originalPrice: 599, 
            price: 459, 
            rating: 4.7,
            imageUrl: "https://images.unsplash.com/photo-1503377992-e1123f72969b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "WORKSHOP"
        }
    ];

    // Use real data if available, otherwise fallback to dummy data
    const allExperiences = experiences && experiences.length > 0 ? experiences : fallbackExperiences;

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
                    <p className="text-[16px] text-neutrals-4 leading-[24px]">
                        For your Next Trip
                    </p>
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
                        <p className="text-md text-gray-600">Displaying sample data as a fallback.</p>
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

                {/* Mobile Horizontal Scroll */}
                <div className="lg:hidden mb-10 w-full">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                        {displayExperiences.slice(0, 4).map((experience) => (
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

                {/* Navigation Arrows */}
                <div className="flex items-center justify-center gap-4">
                    <button className="p-2 rounded-full border-2 border-neutrals-6 hover:border-neutrals-4 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button className="p-2 rounded-full border-2 border-neutrals-6 hover:border-neutrals-4 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const HomePage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [experiences, setExperiences] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [schedules, setSchedules] = useState({}); // Store schedules by experience ID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL'); // Add category state

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch experiences and wishlist items in parallel
                const [experiencesResponse, wishlistResponse] = await Promise.all([
                    fetch('http://localhost:8080/api/experiences'),
                    fetch('http://localhost:8080/api/wishlist-items/user/1') // Using user ID 1 for now
                ]);

                if (!experiencesResponse.ok) {
                    throw new Error(`Failed to fetch experiences: ${experiencesResponse.status}`);
                }

                const experiencesData = await experiencesResponse.json();
                
                // Fetch schedule data for all experiences
                const schedulePromises = experiencesData.map(exp => 
                    fetch(`http://localhost:8080/api/experiences/${exp.experienceId}/schedules`)
                        .then(response => response.ok ? response.json() : [])
                        .catch(() => []) // If schedule fetch fails, use empty array
                );
                
                const schedulesData = await Promise.all(schedulePromises);
                
                // Create schedules object with experience ID as key
                const schedulesMap = {};
                experiencesData.forEach((exp, index) => {
                    schedulesMap[exp.experienceId] = schedulesData[index];
                });
                
                setSchedules(schedulesMap);
                
                // Transform experiences data to match our component structure
                const transformedExperiences = experiencesData.map(exp => ({
                    experienceId: exp.experienceId,
                    id: exp.experienceId,
                    title: exp.title,
                    location: exp.location,
                    price: exp.price,
                    originalPrice: exp.price * 1.2, // Add some original price for demo
                    rating: exp.averageRating || 4.9,
                    imageUrl: exp.coverPhotoUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    shortDescription: exp.shortDescription,
                    duration: exp.duration,
                    category: exp.category,
                    status: exp.status,
                    totalReviews: exp.totalReviews
                }));

                setExperiences(transformedExperiences);

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
                setError(err);
                // Keep fallback data (empty arrays will trigger fallback in DiscoverWeekly)
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

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
                    />
                    <div className="h-px bg-neutrals-6 w-full" />
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default HomePage;
