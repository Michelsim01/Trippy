import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FilterPanel from '../components/FilterPanel';
import SortDropdown from '../components/SortDropdown';

// Mock images - in production these would come from your image assets
const experienceImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

const ProductCard = ({ title = "Venice, Rome & Milan", location = "Karineside", originalPrice = 699, salePrice = 548, rating = 4.9, reviewCount = 0, startDate = "Tue, Jul 20", endDate = "Fri, Jul 23" }) => {
    return (
        <div className="flex flex-col h-[365px] w-64 shrink-0">
            {/* Image Container */}
            <div className="relative flex-1 bg-neutrals-2 rounded-t-[16px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${experienceImage})` }}
                />
                {/* Wishlist Button */}
                <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF6B6B" />
                    </svg>
                </button>
            </div>

            {/* Card Info */}
            <div className="bg-white p-5 rounded-b-[16px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-[16px] font-medium text-neutrals-1 leading-[24px] mb-2">
                            {title}
                        </h3>
                        <div className="flex items-start justify-between">
                            <p className="text-[12px] text-neutrals-3 leading-[20px] flex-1">
                                {location}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="relative">
                                    <span className="text-[12px] font-bold text-neutrals-5 line-through">
                                        ${originalPrice}
                                    </span>
                                </div>
                                <span className="text-[12px] font-bold text-primary-1 uppercase">
                                    ${salePrice}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutrals-6 rounded-[1px]" />

                {/* Date and Rating */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-1 text-[12px] text-neutrals-4 leading-[20px]">
                        <span>{startDate}</span>
                        <span>-</span>
                        <span>{endDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                        </svg>
                        <span className="text-[12px] font-semibold text-neutrals-1">
                            {rating}
                        </span>
                        {reviewCount > 0 && (
                            <span className="text-[10px] text-neutrals-4 ml-1">
                                ({reviewCount})
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock search results - in production this would be an API call
const mockExperiences = [
    { 
        id: 1,
        title: "Venice, Rome & Milan", 
        location: "Karineside", 
        originalPrice: 699, 
        salePrice: 548, 
        rating: 4.9,
        reviewCount: 245,
        duration: "Multi-day",
        durationHours: 168, // 7 days in hours
        availableFrom: "2024-07-20",
        availableTo: "2024-12-20",
        isLiked: false,
        timeOfDay: "morning",
        listingDate: "2024-06-01",
        relevanceScore: 0.95
    },
    { 
        id: 2,
        title: "Paris & Lyon Adventure", 
        location: "Franceville", 
        originalPrice: 799, 
        salePrice: 629, 
        rating: 4.8,
        reviewCount: 189,
        duration: "Multi-day",
        durationHours: 120, // 5 days in hours
        availableFrom: "2024-08-01",
        availableTo: "2024-11-30",
        isLiked: true,
        timeOfDay: "afternoon",
        listingDate: "2024-07-15",
        relevanceScore: 0.87
    },
    { 
        id: 3,
        title: "Tokyo City Explorer", 
        location: "Shibuya", 
        originalPrice: 899, 
        salePrice: 749, 
        rating: 4.7,
        reviewCount: 156,
        duration: "1-3 hours",
        durationHours: 2.5,
        availableFrom: "2024-09-15",
        availableTo: "2024-12-15",
        isLiked: false,
        timeOfDay: "evening",
        listingDate: "2024-08-20",
        relevanceScore: 0.72
    },
    { 
        id: 4,
        title: "Barcelona Highlights", 
        location: "Catalunya", 
        originalPrice: 599, 
        salePrice: 459, 
        rating: 4.6,
        reviewCount: 312,
        duration: "Full day",
        durationHours: 8,
        availableFrom: "2024-07-01",
        availableTo: "2024-10-31",
        isLiked: true,
        timeOfDay: "morning",
        listingDate: "2024-05-10",
        relevanceScore: 0.83
    },
    { 
        id: 5,
        title: "Swiss Alps Journey", 
        location: "Interlaken", 
        originalPrice: 999, 
        salePrice: 819, 
        rating: 4.9,
        reviewCount: 78,
        duration: "Multi-day",
        durationHours: 144, // 6 days in hours
        availableFrom: "2024-06-01",
        availableTo: "2024-09-30",
        isLiked: false,
        timeOfDay: "morning",
        listingDate: "2024-04-25",
        relevanceScore: 0.91
    },
    { 
        id: 6,
        title: "Greek Island Hopping", 
        location: "Santorini", 
        originalPrice: 849, 
        salePrice: 679, 
        rating: 4.8,
        reviewCount: 203,
        duration: "Multi-day",
        durationHours: 240, // 10 days in hours
        availableFrom: "2024-05-01",
        availableTo: "2024-10-15",
        isLiked: true,
        timeOfDay: "afternoon",
        listingDate: "2024-03-12",
        relevanceScore: 0.79
    },
    { 
        id: 7,
        title: "Morocco Desert Trek", 
        location: "Marrakech", 
        originalPrice: 749, 
        salePrice: 599, 
        rating: 4.5,
        reviewCount: 134,
        duration: "Multi-day",
        durationHours: 192, // 8 days in hours
        availableFrom: "2024-04-01",
        availableTo: "2024-11-30",
        isLiked: false,
        timeOfDay: "evening",
        listingDate: "2024-02-28",
        relevanceScore: 0.68
    },
    { 
        id: 8,
        title: "Northern Lights", 
        location: "Reykjavik", 
        originalPrice: 1199, 
        salePrice: 999, 
        rating: 4.9,
        reviewCount: 267,
        duration: "Half day",
        durationHours: 4,
        availableFrom: "2024-11-01",
        availableTo: "2024-03-31",
        isLiked: false,
        timeOfDay: "evening",
        listingDate: "2024-09-05",
        relevanceScore: 0.88
    },
];

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        priceRange: { min: 0, max: 2000 },
        duration: '',
        startDate: '',
        endDate: '',
        onlyLiked: false,
        reviewScores: [] // array of selected star ratings (1-5)
    });

    // Sort state
    const [sortBy, setSortBy] = useState('bestMatch');

    const query = searchParams.get('q') || '';

    const popularExperiences = mockExperiences.slice(0, 4);

    // Filter function
    const applyFilters = (experiences) => {
        return experiences.filter(experience => {
            // Price filter
            if (experience.salePrice < filters.priceRange.min || experience.salePrice > filters.priceRange.max) {
                return false;
            }

            // Duration filter
            if (filters.duration && experience.duration !== filters.duration) {
                return false;
            }

            // Date range filter
            if (filters.startDate && experience.availableFrom < filters.startDate) {
                return false;
            }
            if (filters.endDate && experience.availableTo > filters.endDate) {
                return false;
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

    useEffect(() => {
        // Mock search functionality - in production this would be an API call
        const performSearch = async () => {
            setLoading(true);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (query.trim()) {
                // Filter experiences based on query
                const filtered = mockExperiences.filter(experience =>
                    experience.title.toLowerCase().includes(query.toLowerCase()) ||
                    experience.location.toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
            
            setLoading(false);
        };

        performSearch();
    }, [query]);

    // Apply filters and sorting whenever filters, sorting, or search results change
    useEffect(() => {
        const filtered = applyFilters(searchResults);
        const sorted = applySorting(filtered);
        setFilteredResults(sorted);
    }, [searchResults, filters, sortBy]);

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
                                <div className="flex items-center gap-4">
                                    <div className="bg-neutrals-1 text-white px-4 py-1.5 rounded-full">
                                        <span className="text-[14px] font-bold">All Experiences</span>
                                    </div>
                                    <div className="text-neutrals-4 px-4 py-1.5 rounded-full">
                                        <span className="text-[14px] font-bold">Adventure</span>
                                    </div>
                                    <div className="text-neutrals-4 px-4 py-1.5 rounded-full">
                                        <span className="text-[14px] font-bold">Culture</span>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                /* Loading State */
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                                        <p className="text-neutrals-4">Searching for experiences...</p>
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
                                        {/* Desktop Sort Control */}
                                        <div className="hidden lg:flex items-center justify-between mb-6">
                                            <p className="text-[14px] text-neutrals-4">
                                                Showing {filteredResults.length} results
                                            </p>
                                            <SortDropdown
                                                currentSort={sortBy}
                                                onSortChange={handleSortChange}
                                                variant="desktop"
                                            />
                                        </div>

                                        {/* Desktop Grid */}
                                        <div className="hidden lg:flex lg:flex-wrap lg:justify-start lg:gap-6 mb-10">
                                            {filteredResults.map((experience, index) => (
                                                <ProductCard key={experience.id || index} {...experience} />
                                            ))}
                                        </div>

                                        {/* Mobile Horizontal Scroll */}
                                        <div className="lg:hidden mb-10 w-full">
                                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                                {filteredResults.map((experience, index) => (
                                                    <ProductCard key={experience.id || index} {...experience} />
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
                                                    <ProductCard key={index} {...experience} />
                                                ))}
                                            </div>

                                            {/* Mobile Horizontal Scroll */}
                                            <div className="lg:hidden">
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                                    {popularExperiences.map((experience, index) => (
                                                        <ProductCard key={index} {...experience} />
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
                            <div className="flex overflow-x-auto gap-4 pb-2 flex-1">
                                <div className="bg-neutrals-1 text-white px-4 py-1.5 rounded-full shrink-0">
                                    <span className="text-[14px] font-bold">All Experiences</span>
                                </div>
                                <div className="text-neutrals-4 px-4 py-1.5 rounded-full shrink-0">
                                    <span className="text-[14px] font-bold">Adventure</span>
                                </div>
                                <div className="text-neutrals-4 px-4 py-1.5 rounded-full shrink-0">
                                    <span className="text-[14px] font-bold">Culture</span>
                                </div>
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
                                    <p className="text-neutrals-4 text-sm">Searching for experiences...</p>
                                </div>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            /* Search Results - Mobile */
                            <>
                                {/* Mobile Sort Control */}
                                <div className="mb-4">
                                    <SortDropdown
                                        currentSort={sortBy}
                                        onSortChange={handleSortChange}
                                        variant="mobile"
                                    />
                                </div>

                                {/* Mobile Results */}
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {filteredResults.map((experience, index) => (
                                        <ProductCard key={experience.id || index} {...experience} />
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
                                                <ProductCard key={index} {...experience} />
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