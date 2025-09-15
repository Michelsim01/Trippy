import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FilterPanel from '../components/FilterPanel';
import FilterBar from '../components/FilterBar';
import ExperienceCard from '../components/ExperienceCard';

// Helper function to transform API data to match filter expectations
const transformExperienceData = (apiData, wishlistItems = []) => {
    const wishlistedIds = new Set(wishlistItems.map(item => item.experienceId));
    
    return apiData.map(exp => ({
        id: exp.experienceId,
        experienceId: exp.experienceId,
        title: exp.title,
        location: exp.location,
        originalPrice: exp.price ? exp.price * 1.2 : 0, // Add 20% markup for "original" price
        salePrice: exp.price || 0,
        rating: exp.averageRating || 4.5,
        reviewCount: exp.totalReviews || 0,
        duration: exp.duration ? `${exp.duration} hours` : "Unknown",
        durationHours: exp.duration || 0,
        availableFrom: exp.createdAt ? exp.createdAt.split('T')[0] : "2025-01-01",
        availableTo: exp.updatedAt ? exp.updatedAt.split('T')[0] : "2025-12-31",
        isLiked: wishlistedIds.has(exp.experienceId),
        timeOfDay: "morning", // Default since we don't have this in API
        listingDate: exp.createdAt ? exp.createdAt.split('T')[0] : "2025-01-01",
        relevanceScore: 0.8, // Default relevance score
        coverPhotoUrl: exp.coverPhotoUrl,
        shortDescription: exp.shortDescription,
        category: exp.category,
        status: exp.status,
        // Add all the fields that ExperienceCard expects
        experience: {
            experienceId: exp.experienceId,
            title: exp.title,
            location: exp.location,
            price: exp.price,
            originalPrice: exp.price ? exp.price * 1.2 : 0,
            rating: exp.averageRating || 4.5,
            imageUrl: exp.coverPhotoUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            shortDescription: exp.shortDescription,
            duration: exp.duration,
            category: exp.category,
            status: exp.status,
            totalReviews: exp.totalReviews
        }
    }));
};

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [allExperiences, setAllExperiences] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [schedules, setSchedules] = useState({});
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL'); // Add category state

    // Category options
    const categoryOptions = [
        { value: 'ALL', label: 'All Experiences' },
        { value: 'GUIDED_TOUR', label: 'Guided Tour' },
        { value: 'DAYTRIP', label: 'Day Trip' },
        { value: 'ADVENTURE', label: 'Adventure' },
        { value: 'WORKSHOP', label: 'Workshop' },
        { value: 'WATER_ACTIVITY', label: 'Water Activity' },
        { value: 'OTHERS', label: 'Others' }
    ];

    // Filter states
    const [filters, setFilters] = useState({
        priceRange: { min: 0, max: 0, enabled: false }, // Start disabled
        duration: [], // Changed to array to support multiple selections
        startDate: '',
        endDate: '',
        onlyLiked: false,
        reviewScores: [] // array of selected star ratings (1-5)
    });

    // Sort state
    const [sortBy, setSortBy] = useState('bestMatch'); // Default to best match for search relevance

    const query = searchParams.get('q') || '';

    // Get popular experiences (first 4 from all experiences)
    const popularExperiences = allExperiences.slice(0, 4);

    // Helper function to check if duration matches any of the selected filters
    const matchesDurationFilter = (durationHours, selectedDurations) => {
        // If no duration filters are selected, show all
        if (selectedDurations.length === 0) {
            return true;
        }
        
        // Check if the duration matches any of the selected filters
        return selectedDurations.some(filterDuration => {
            switch (filterDuration) {
                case '1-3 hours':
                    return durationHours >= 1 && durationHours <= 3;
                case '4-8 hours':
                    return durationHours >= 4 && durationHours <= 8;
                case '8-12 hours':
                    return durationHours >= 8 && durationHours <= 12;
                case '12-24 hours':
                    return durationHours >= 12 && durationHours <= 24;
                case '24+ hours':
                    return durationHours > 24;
                default:
                    return false;
            }
        });
    };

    // Filter function
    const applyFilters = (experiences, schedulesData = {}) => {
        return experiences.filter(experience => {
            // Category filter
            if (selectedCategory !== 'ALL' && experience.experience.category !== selectedCategory) {
                return false;
            }

            // Price filter - only apply if enabled and values are set
            if (filters.priceRange.enabled) {
                if (filters.priceRange.min > 0 && experience.salePrice < filters.priceRange.min) {
                    return false;
                }
                if (filters.priceRange.max > 0 && experience.salePrice > filters.priceRange.max) {
                    return false;
                }
            }

            // Duration filter - now works with multiple selections and numeric hours
            if (!matchesDurationFilter(experience.durationHours, filters.duration)) {
                return false;
            }

            // Date range filter - now uses schedule data
            if (filters.startDate || filters.endDate) {
                const experienceSchedules = schedulesData[experience.experienceId] || [];
                
                // If no schedules available, skip this experience
                if (experienceSchedules.length === 0) {
                    return false;
                }
                
                // Check if any schedule matches the date range
                const hasMatchingSchedule = experienceSchedules.some(schedule => {
                    const scheduleStartDate = new Date(schedule.startDate);
                    const scheduleEndDate = new Date(schedule.endDate);
                    
                    // Extract just the date part (ignore time)
                    const scheduleStartDateOnly = scheduleStartDate.toISOString().split('T')[0];
                    const scheduleEndDateOnly = scheduleEndDate.toISOString().split('T')[0];
                    
                    // Check start date filter
                    if (filters.startDate && scheduleStartDateOnly < filters.startDate) {
                        return false;
                    }
                    
                    // Check end date filter
                    if (filters.endDate && scheduleEndDateOnly > filters.endDate) {
                        return false;
                    }
                    
                    return true;
                });
                
                if (!hasMatchingSchedule) {
                    return false;
                }
            }

            // Liked filter
            if (filters.onlyLiked && !experience.isLiked) {
                return false;
            }

            // Review score filter
            if (filters.reviewScores.length > 0) {
                const roundedRating = Math.round(experience.rating);
                if (!filters.reviewScores.includes(roundedRating)) {
                    return false;
                }
            }

            return true;
        });
    };

    // Sorting function
    const applySorting = (experiences) => {
        const sorted = [...experiences];

        switch (sortBy) {
            case 'cheapest':
                return sorted.sort((a, b) => a.salePrice - b.salePrice);
            
            case 'trustiest':
                return sorted.sort((a, b) => {
                    // Calculate trust score (weighted combination of rating and review count)
                    const trustScoreA = (a.rating * 0.7) + (Math.min(a.reviewCount / 100, 3) * 0.3);
                    const trustScoreB = (b.rating * 0.7) + (Math.min(b.reviewCount / 100, 3) * 0.3);
                    
                    if (Math.abs(trustScoreA - trustScoreB) < 0.01) {
                        // If trust scores are very close, prioritize more reviews
                        return b.reviewCount - a.reviewCount;
                    }
                    return trustScoreB - trustScoreA;
                });
            
            case 'quickest':
                return sorted.sort((a, b) => a.durationHours - b.durationHours);
            
            case 'timeOfDay':
                // Sort by time of day: morning, afternoon, evening
                const timeOrder = { morning: 0, afternoon: 1, evening: 2 };
                return sorted.sort((a, b) => {
                    const orderA = timeOrder[a.timeOfDay] ?? 3;
                    const orderB = timeOrder[b.timeOfDay] ?? 3;
                    if (orderA === orderB) {
                        // Secondary sort by relevance if same time of day
                        return b.relevanceScore - a.relevanceScore;
                    }
                    return orderA - orderB;
                });
            
            case 'newest':
                return sorted.sort((a, b) => new Date(b.listingDate) - new Date(a.listingDate));
            
            case 'bestMatch':
            default:
                return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
    };

    // Fetch all experiences and wishlist data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
            setLoading(true);
                setError(null);

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
                
                const transformedExperiences = transformExperienceData(experiencesData, []);
                setAllExperiences(transformedExperiences);

                // Handle wishlist response
                if (wishlistResponse.ok) {
                    const wishlistData = await wishlistResponse.json();
                    const transformedWishlist = wishlistData.map(item => ({
                        experienceId: item.experience.experienceId,
                        wishlistItemId: item.wishlistItemId
                    }));
                    setWishlistItems(transformedWishlist);
                    
                    // Update experiences with wishlist status
                    const updatedExperiences = transformExperienceData(experiencesData, transformedWishlist);
                    setAllExperiences(updatedExperiences);
                } else {
                    // If wishlist fails, just set empty array
                    setWishlistItems([]);
                }

            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Perform search when query changes
    useEffect(() => {
            if (query.trim()) {
                // Filter experiences based on query
            const filtered = allExperiences.filter(experience =>
                    experience.title.toLowerCase().includes(query.toLowerCase()) ||
                experience.location.toLowerCase().includes(query.toLowerCase()) ||
                (experience.shortDescription && experience.shortDescription.toLowerCase().includes(query.toLowerCase()))
                );
                console.log('Search query:', query);
                console.log('All experiences:', allExperiences.map(exp => ({ title: exp.title, location: exp.location })));
                console.log('Filtered results:', filtered.map(exp => ({ title: exp.title, location: exp.location })));
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
    }, [query, allExperiences]);

    // Apply filters and sorting whenever filters, sorting, or search results change
    useEffect(() => {
        const filtered = applyFilters(searchResults, schedules);
        const sorted = applySorting(filtered);
        setFilteredResults(sorted);
    }, [searchResults, filters, sortBy, selectedCategory, schedules]);

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
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
                    <main className="w-full min-h-screen">
                        <div className="px-8 py-10">
                            {/* Search Results Header */}
                            <div className="mb-8">
                                <h1 className="text-[32px] lg:text-[40px] font-bold text-neutrals-1 leading-[40px] lg:leading-[48px] tracking-[-0.32px] mb-2">
                                    Search Results
                                </h1>
                                {query && (
                                    <p className="text-[16px] text-neutrals-4 leading-[24px]">
                                        {loading ? 'Searching...' : `${filteredResults.length} results for "${query}"`}
                                    </p>
                                )}
                            </div>

                            {/* Filter */}
                            <div className="flex items-center justify-center mb-10">
                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                    {categoryOptions.map((category) => (
                                        <button
                                            key={category.value}
                                            onClick={() => setSelectedCategory(category.value)}
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

                            {loading ? (
                                /* Loading State */
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                                        <p className="text-neutrals-4">Loading experiences...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                /* Error State */
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <svg className="w-24 h-24 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <h3 className="text-[24px] font-bold text-neutrals-2 mb-2">Error loading experiences</h3>
                                        <p className="text-[16px] text-neutrals-4 mb-6">
                                            {error.message || 'Failed to load experiences. Please try again.'}
                                        </p>
                                        <button 
                                            onClick={() => window.location.reload()} 
                                            className="bg-primary-1 text-white px-6 py-2 rounded-lg hover:bg-primary-2 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : filteredResults.length > 0 ? (
                                /* Search Results */
                                <div className="flex gap-8">
                                    {/* Desktop Filter Panel */}
                                    <FilterPanel
                                        filters={filters}
                                        onFiltersChange={handleFiltersChange}
                                        variant="desktop"
                                    />
                                    
                                    {/* Results Content */}
                                    <div className="flex-1">
                                        {/* Desktop Filter Bar */}
                                        <div className="hidden lg:block mb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[14px] text-neutrals-4">
                                                    Showing {filteredResults.length} results
                                                </p>
                                            </div>
                                            <FilterBar
                                                currentSort={sortBy}
                                                onSortChange={handleSortChange}
                                            />
                                        </div>

                                        {/* Desktop Grid */}
                                        <div className="hidden lg:flex lg:flex-wrap lg:justify-start lg:gap-6 mb-10">
                                            {filteredResults.map((experience, index) => (
                                                <ExperienceCard 
                                                    key={experience.id || index} 
                                                    experience={experience.experience}
                                                    showWishlistButton={true}
                                                    isInWishlist={experience.isLiked}
                                                    schedules={schedules[experience.experienceId] || []}
                                                />
                                            ))}
                                        </div>

                                        {/* Mobile Horizontal Scroll */}
                                        <div className="lg:hidden mb-10 w-full">
                                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                                {filteredResults.map((experience, index) => (
                                                    <ExperienceCard 
                                                        key={experience.id || index} 
                                                        experience={experience.experience}
                                                        showWishlistButton={true}
                                                        isInWishlist={experience.isLiked}
                                                        schedules={schedules[experience.experienceId] || []}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : searchResults.length > 0 && filteredResults.length === 0 ? (
                                /* No Filtered Results */
                                <div className="flex gap-8">
                                    {/* Desktop Filter Panel */}
                                    <FilterPanel
                                        filters={filters}
                                        onFiltersChange={handleFiltersChange}
                                        variant="desktop"
                                    />
                                    
                                    {/* No Results Content */}
                                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                                        <div className="text-center">
                                            <svg className="w-24 h-24 text-neutrals-5 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="text-[24px] font-bold text-neutrals-2 mb-2">No matches found</h3>
                                            <p className="text-[16px] text-neutrals-4 mb-6">
                                                Try adjusting your filters to see more results
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Empty Results */
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="text-center mb-10">
                                        <svg className="w-24 h-24 text-neutrals-5 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <h3 className="text-[24px] font-bold text-neutrals-2 mb-2">No results found</h3>
                                        <p className="text-[16px] text-neutrals-4 mb-6">
                                            {query ? `We couldn't find any experiences matching "${query}"` : 'Enter a search term to find experiences'}
                                        </p>
                                    </div>

                                    {/* Popular Suggestions */}
                                    {query && (
                                        <div className="w-full max-w-[1200px]">
                                            <h4 className="text-[20px] font-bold text-neutrals-2 mb-6 text-center">
                                                Popular Experiences
                                            </h4>
                                            
                                            {/* Desktop Grid */}
                                            <div className="hidden lg:flex lg:justify-center lg:gap-6">
                                                {popularExperiences.map((experience, index) => (
                                                    <ExperienceCard 
                                                        key={index} 
                                                        experience={experience.experience}
                                                        showWishlistButton={true}
                                                        isInWishlist={experience.isLiked}
                                                        schedules={schedules[experience.experienceId] || []}
                                                    />
                                                ))}
                                            </div>

                                            {/* Mobile Horizontal Scroll */}
                                            <div className="lg:hidden">
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                                    {popularExperiences.map((experience, index) => (
                                                        <ExperienceCard 
                                                            key={index} 
                                                            experience={experience.experience}
                                                            showWishlistButton={true}
                                                            isInWishlist={experience.isLiked}
                                                            schedules={schedules[experience.experienceId] || []}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
                <main className="w-full min-h-screen">
                    <div className="px-4 py-6">
                        {/* Search Results Header */}
                        <div className="mb-6">
                            <h1 className="text-[24px] font-bold text-neutrals-1 leading-[32px] tracking-[-0.24px] mb-2">
                                Search Results
                            </h1>
                            {query && (
                                <p className="text-[14px] text-neutrals-4 leading-[20px]">
                                    {loading ? 'Searching...' : `${filteredResults.length} results for "${query}"`}
                                </p>
                            )}
                        </div>

                        {/* Mobile Filter Button */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex overflow-x-auto gap-2 pb-2 flex-1">
                                {categoryOptions.map((category) => (
                                    <button
                                        key={category.value}
                                        onClick={() => setSelectedCategory(category.value)}
                                        className={`px-4 py-1.5 rounded-full shrink-0 transition-colors ${
                                            selectedCategory === category.value
                                                ? 'bg-neutrals-1 text-white'
                                                : 'text-neutrals-4 hover:text-neutrals-1'
                                        }`}
                                    >
                                        <span className="text-[14px] font-bold">{category.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="ml-4 flex items-center gap-2 px-4 py-2 border border-neutrals-6 rounded-lg bg-white shrink-0"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                                <span className="text-[14px] font-medium text-neutrals-2">Filter</span>
                            </button>
                        </div>

                        {/* Mobile Filter Panel */}
                        <FilterPanel
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            isOpen={showMobileFilters}
                            onClose={() => setShowMobileFilters(false)}
                            variant="mobile"
                        />

                        {loading ? (
                            /* Loading State */
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-1 mx-auto mb-4"></div>
                                    <p className="text-neutrals-4 text-sm">Loading experiences...</p>
                                </div>
                            </div>
                        ) : error ? (
                            /* Error State */
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center">
                                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <h3 className="text-[18px] font-bold text-neutrals-2 mb-2">Error loading experiences</h3>
                                    <p className="text-[14px] text-neutrals-4 mb-4 px-4">
                                        {error.message || 'Failed to load experiences. Please try again.'}
                                    </p>
                                    <button 
                                        onClick={() => window.location.reload()} 
                                        className="bg-primary-1 text-white px-4 py-2 rounded-lg hover:bg-primary-2 transition-colors text-sm"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            /* Search Results - Mobile */
                            <>
                                {/* Mobile Filter Bar */}
                                <div className="mb-4">
                                    <FilterBar
                                        currentSort={sortBy}
                                        onSortChange={handleSortChange}
                                        className="flex-wrap"
                                    />
                                </div>

                                {/* Mobile Results */}
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {filteredResults.map((experience, index) => (
                                        <ExperienceCard 
                                            key={experience.id || index} 
                                            experience={experience.experience}
                                            showWishlistButton={true}
                                            isInWishlist={experience.isLiked}
                                            schedules={schedules[experience.experienceId] || []}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : searchResults.length > 0 && filteredResults.length === 0 ? (
                            /* No Filtered Results - Mobile */
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="text-center">
                                    <svg className="w-16 h-16 text-neutrals-5 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-[18px] font-bold text-neutrals-2 mb-2">No matches found</h3>
                                    <p className="text-[14px] text-neutrals-4 mb-4 px-4">
                                        Try adjusting your filters to see more results
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Empty Results */
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="text-center mb-8">
                                    <svg className="w-16 h-16 text-neutrals-5 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <h3 className="text-[20px] font-bold text-neutrals-2 mb-2">No results found</h3>
                                    <p className="text-[14px] text-neutrals-4 mb-6 px-4">
                                        {query ? `We couldn't find any experiences matching "${query}"` : 'Enter a search term to find experiences'}
                                    </p>
                                </div>

                                {/* Popular Suggestions */}
                                {query && (
                                    <div className="w-full">
                                        <h4 className="text-[18px] font-bold text-neutrals-2 mb-4 text-center">
                                            Popular Experiences
                                        </h4>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                            {popularExperiences.map((experience, index) => (
                                                <ExperienceCard 
                                                    key={index} 
                                                    experience={experience.experience}
                                                    showWishlistButton={true}
                                                    isInWishlist={experience.isLiked}
                                                    schedules={schedules[experience.experienceId] || []}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="h-px bg-neutrals-6 w-full" />
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default SearchResultsPage;