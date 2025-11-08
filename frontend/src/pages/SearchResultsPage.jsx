import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FilterPanel from '../components/FilterPanel';
import FilterBar from '../components/FilterBar';
import ExperienceCard from '../components/ExperienceCard';
import { useAuth } from '../contexts/AuthContext';
import { experienceApi } from '../services/experienceApi';

// Helper function to transform API data to match ExperienceCard expectations (same as HomePage)
const transformExperienceData = (apiData, wishlistItems = []) => {
    const wishlistedIds = new Set(wishlistItems.map(item => item.experienceId));
    
    return apiData.map(exp => {
        // Fix broken image URLs (same logic as HomePage)
        let imageUrl = exp.coverPhotoUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
        if (imageUrl && imageUrl.includes('localhost:3845')) {
            const fallbackImages = [
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                "https://images.unsplash.com/photo-1502602898669-a38738f73650?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                "https://images.unsplash.com/photo-1545892204-e37749721199?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                "https://images.unsplash.com/photo-1503377992-e1123f72969b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            ];
            imageUrl = fallbackImages[exp.experienceId % fallbackImages.length];
        }
        
        return {
            experienceId: exp.experienceId,
            id: exp.experienceId,
            title: exp.title,
            location: exp.location,
            country: exp.country,
            price: exp.price, // This is the key field that was missing!
            averageRating: exp.averageRating || 4.9,
            imageUrl: imageUrl,
            shortDescription: exp.shortDescription,
            duration: exp.duration,
            category: exp.category,
            status: exp.status,
            totalReviews: exp.totalReviews,
            participantsAllowed: exp.participantsAllowed || 20,
            isLiked: wishlistedIds.has(exp.experienceId),
            // Add fields needed for sorting
            reviewCount: exp.totalReviews || 0,
            durationHours: exp.duration ? parseInt(exp.duration.toString().split(' ')[0]) || 0 : 0,
            relevanceScore: 0.8, // Default relevance score
            listingDate: exp.createdAt ? exp.createdAt.split('T')[0] : "2025-01-01"
        };
    });
};

const SearchResultsPage = () => {
    const { user } = useAuth();
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
    const [wishlistHasChanged, setWishlistHasChanged] = useState(false); // Track if wishlist changed since last filter

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
    const matchesDurationFilter = (duration, selectedDurations) => {
        // If no duration filters are selected, show all
        if (selectedDurations.length === 0) {
            return true;
        }
        
        // Extract numeric hours from duration string (e.g., "24 hours" -> 24)
        const durationHours = duration ? parseInt(duration.toString().split(' ')[0]) || 0 : 0;
        
        // Check if the duration matches any of the selected filters
        return selectedDurations.some(filterDuration => {
            switch (filterDuration) {
                case '1-4 hours':
                    return durationHours >= 1 && durationHours <= 4;
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
        console.log('SearchResultsPage - Applying filters:', {
            filters,
            selectedCategory,
            totalExperiences: experiences.length,
            schedulesDataKeys: Object.keys(schedulesData)
        });
        
        const filtered = experiences.filter(experience => {
            console.log('SearchResultsPage - Filtering experience:', {
                id: experience.experienceId,
                title: experience.title,
                price: experience.price,
                category: experience.category,
                duration: experience.duration
            });
            // Category filter
            if (selectedCategory !== 'ALL' && experience.category !== selectedCategory) {
                return false;
            }

            // Price filter - only apply if enabled and values are set
            if (filters.priceRange.enabled) {
                const price = experience.price || 0;
                console.log('SearchResultsPage - Price filter check:', {
                    enabled: filters.priceRange.enabled,
                    min: filters.priceRange.min,
                    max: filters.priceRange.max,
                    experiencePrice: price,
                    passesMin: filters.priceRange.min <= 0 || price >= filters.priceRange.min,
                    passesMax: filters.priceRange.max <= 0 || price <= filters.priceRange.max
                });
                if (filters.priceRange.min > 0 && price < filters.priceRange.min) {
                    console.log('SearchResultsPage - Filtered out by min price');
                    return false;
                }
                if (filters.priceRange.max > 0 && price > filters.priceRange.max) {
                    console.log('SearchResultsPage - Filtered out by max price');
                    return false;
                }
            }

            // Duration filter - now works with multiple selections and numeric hours
            if (!matchesDurationFilter(experience.duration, filters.duration)) {
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
                    const scheduleStartDate = new Date(schedule.startDateTime || schedule.startDate);
                    const scheduleEndDate = new Date(schedule.endDateTime || schedule.endDate);
                    
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
                const roundedRating = Math.round(experience.averageRating);
                if (!filters.reviewScores.includes(roundedRating)) {
                    return false;
                }
            }

            return true;
        });
        
        console.log('SearchResultsPage - Filter results:', {
            originalCount: experiences.length,
            filteredCount: filtered.length,
            filteredTitles: filtered.map(exp => exp.title)
        });
        
        return filtered;
    };

    // Sorting function
    const applySorting = (experiences) => {
        const sorted = [...experiences];
        
        console.log('SearchResultsPage - Applying sorting:', {
            sortBy,
            totalExperiences: sorted.length,
            firstExperience: sorted[0] ? {
                title: sorted[0].title,
                price: sorted[0].price,
                averageRating: sorted[0].averageRating,
                reviewCount: sorted[0].reviewCount,
                durationHours: sorted[0].durationHours
            } : null
        });

        switch (sortBy) {
            case 'cheapest':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            
            case 'trustiest':
                return sorted.sort((a, b) => {
                    // Calculate trust score (weighted combination of rating and review count)
                    const trustScoreA = ((a.averageRating || 0) * 0.7) + (Math.min((a.reviewCount || 0) / 100, 3) * 0.3);
                    const trustScoreB = ((b.averageRating || 0) * 0.7) + (Math.min((b.reviewCount || 0) / 100, 3) * 0.3);
                    
                    if (Math.abs(trustScoreA - trustScoreB) < 0.01) {
                        // If trust scores are very close, prioritize more reviews
                        return (b.reviewCount || 0) - (a.reviewCount || 0);
                    }
                    return trustScoreB - trustScoreA;
                });
            
            case 'shortest':
                return sorted.sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
            
            case 'newest':
                return sorted.sort((a, b) => new Date(b.listingDate || '2025-01-01') - new Date(a.listingDate || '2025-01-01'));
            
            case 'bestMatch':
            default:
                return sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
    };

    // Fetch all experiences and wishlist data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
            setLoading(true);
                setError(null);

                // Fetch experiences and wishlist items in parallel
                const [experiencesData, wishlistResponse] = await Promise.all([
                    experienceApi.getAllExperiences(),
                    fetch(`http://localhost:8080/api/wishlist-items/user/${user?.id || user?.userId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);
                
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

        if (user?.id || user?.userId) {
            fetchData();
        }
    }, [user?.id, user?.userId]);

    // Perform search when query changes
    useEffect(() => {
            if (query.trim()) {
                // Filter experiences based on query
            const filtered = allExperiences.filter(experience =>
                    experience.title.toLowerCase().includes(query.toLowerCase()) ||
                experience.location.toLowerCase().includes(query.toLowerCase()) ||
                (experience.country && experience.country.toLowerCase().includes(query.toLowerCase())) ||
                (experience.shortDescription && experience.shortDescription.toLowerCase().includes(query.toLowerCase()))
                );
                console.log('Search query:', query);
                console.log('All experiences:', allExperiences.map(exp => ({ title: exp.title, location: exp.location, country: exp.country })));
                console.log('Filtered results:', filtered.map(exp => ({ title: exp.title, location: exp.location, country: exp.country })));
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
    }, [query, allExperiences]);

    // Load popular experiences from API
    useEffect(() => {
        const loadPopularExperiences = async () => {
            try {
                const allExperiences = await experienceApi.getAllExperiences();
                if (allExperiences && allExperiences.length > 0) {
                    
                    // Transform and take first 4 as popular experiences
                    const transformedPopular = allExperiences.slice(0, 4).map(exp => ({
                        id: exp.experienceId,
                        title: exp.title,
                        location: exp.location,
                        originalPrice: null, // No discount, so no original price
                        price: exp.price ? parseFloat(exp.price) : 99, // Use 'price' field that ExperienceCard expects, default to $99 if no price
                        averageRating: exp.averageRating || 4.9,
                        reviewCount: exp.totalReviews || 0,
                        duration: exp.duration ? `${exp.duration} hours` : "Multi-day",
                        durationHours: exp.duration ? parseFloat(exp.duration) : 48,
                        availableFrom: "2025-07-20",
                        availableTo: "2025-12-20",
                        isLiked: false,
                        listingDate: exp.createdAt || "2025-06-01",
                        relevanceScore: 0.95
                    }));
                    
                    setAllExperiences(transformedPopular);
                } else {
                    // API failed - no data available
                    setAllExperiences([]);
                }
            } catch (error) {
                console.error('Error loading popular experiences:', error);
                // API error - no data available
                setAllExperiences([]);
            }
        };

        loadPopularExperiences();
    }, []);

    // Sync wishlist data when filters change (only if wishlist has changed)
    const syncWishlistData = () => {
        if (wishlistHasChanged && allExperiences.length > 0) {
            const wishlistedIds = new Set(wishlistItems.map(item => item.experienceId));
            
            // Update allExperiences
            setAllExperiences(prev => prev.map(exp => ({
                ...exp,
                isLiked: wishlistedIds.has(exp.experienceId)
            })));
            
            // Update searchResults if they exist
            if (searchResults.length > 0) {
                setSearchResults(prev => prev.map(exp => ({
                    ...exp,
                    isLiked: wishlistedIds.has(exp.experienceId)
                })));
            }
            
            // Reset the flag
            setWishlistHasChanged(false);
        }
    };

    // Apply filters and sorting whenever filters, sorting, or search results change
    useEffect(() => {
        // Sync wishlist data if it has changed since last filter
        syncWishlistData();
        
        const filtered = applyFilters(searchResults, schedules);
        const sorted = applySorting(filtered);
        console.log('SearchResultsPage - Final sorted results:', {
            sortBy,
            filteredCount: filtered.length,
            sortedCount: sorted.length,
            sortedTitles: sorted.map(exp => exp.title),
            sortedPrices: sorted.map(exp => exp.price),
            sortedRatings: sorted.map(exp => exp.averageRating)
        });
        setFilteredResults(sorted);
    }, [searchResults, filters, sortBy, selectedCategory, schedules]);

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleSortChange = (newSort) => {
        console.log('SearchResultsPage - Sort change:', {
            from: sortBy,
            to: newSort
        });
        setSortBy(newSort);
    };

    // Handle wishlist toggle from ExperienceCard
    const handleWishlistToggle = (experienceId, isLiked) => {
        console.log('SearchResultsPage - Wishlist toggle:', { experienceId, isLiked });
        
        // Update wishlist state
        if (isLiked) {
            setWishlistItems(prev => [...prev, { experienceId, wishlistItemId: `temp_${experienceId}` }]);
        } else {
            setWishlistItems(prev => prev.filter(item => item.experienceId !== experienceId));
        }
        
        // Mark that wishlist has changed since last filter
        setWishlistHasChanged(true);
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

                            {/* Filter Categories */}
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
                                                    experience={experience}
                                                    showWishlistButton={true}
                                                    isInWishlist={experience.isLiked}
                                                    schedules={schedules[experience.experienceId] || []}
                                                    onWishlistToggle={handleWishlistToggle}
                                                />
                                            ))}
                                        </div>

                                        {/* Mobile Horizontal Scroll */}
                                        <div className="lg:hidden mb-10 w-full">
                                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                                {filteredResults.map((experience, index) => (
                                                    <ExperienceCard 
                                                        key={experience.id || index} 
                                                        experience={experience}
                                                        showWishlistButton={true}
                                                        isInWishlist={experience.isLiked}
                                                        schedules={schedules[experience.experienceId] || []}
                                                        onWishlistToggle={handleWishlistToggle}
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
                                                        experience={experience}
                                                        showWishlistButton={true}
                                                        isInWishlist={experience.isLiked}
                                                        schedules={schedules[experience.experienceId] || []}
                                                        onWishlistToggle={handleWishlistToggle}
                                                    />
                                                ))}
                                            </div>

                                            {/* Mobile Horizontal Scroll */}
                                            <div className="lg:hidden">
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                                    {popularExperiences.map((experience, index) => (
                                                        <ExperienceCard 
                                                            key={index} 
                                                            experience={experience}
                                                            showWishlistButton={true}
                                                            isInWishlist={experience.isLiked}
                                                            schedules={schedules[experience.experienceId] || []}
                                                            onWishlistToggle={handleWishlistToggle}
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
                                            experience={experience}
                                            showWishlistButton={true}
                                            isInWishlist={experience.isLiked}
                                            schedules={schedules[experience.experienceId] || []}
                                            onWishlistToggle={handleWishlistToggle}
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
                                                    experience={experience}
                                                    showWishlistButton={true}
                                                    isInWishlist={experience.isLiked}
                                                    schedules={schedules[experience.experienceId] || []}
                                                    onWishlistToggle={handleWishlistToggle}
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