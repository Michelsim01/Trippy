import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Mock images - in production these would come from your image assets
const experienceImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

const ProductCard = ({ title = "Venice, Rome & Milan", location = "Karineside", originalPrice = 699, salePrice = 548, rating = 4.9, startDate = "Tue, Jul 20", endDate = "Fri, Jul 23" }) => {
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
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock search results - in production this would be an API call
const mockExperiences = [
    { title: "Venice, Rome & Milan", location: "Karineside", originalPrice: 699, salePrice: 548, rating: 4.9 },
    { title: "Paris & Lyon Adventure", location: "Franceville", originalPrice: 799, salePrice: 629, rating: 4.8 },
    { title: "Tokyo City Explorer", location: "Shibuya", originalPrice: 899, salePrice: 749, rating: 4.7 },
    { title: "Barcelona Highlights", location: "Catalunya", originalPrice: 599, salePrice: 459, rating: 4.6 },
    { title: "Swiss Alps Journey", location: "Interlaken", originalPrice: 999, salePrice: 819, rating: 4.9 },
    { title: "Greek Island Hopping", location: "Santorini", originalPrice: 849, salePrice: 679, rating: 4.8 },
    { title: "Morocco Desert Trek", location: "Marrakech", originalPrice: 749, salePrice: 599, rating: 4.5 },
    { title: "Northern Lights", location: "Reykjavik", originalPrice: 1199, salePrice: 999, rating: 4.9 },
];

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const query = searchParams.get('q') || '';

    const popularExperiences = mockExperiences.slice(0, 4);

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
                                        {loading ? 'Searching...' : `${searchResults.length} results for "${query}"`}
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
                            ) : searchResults.length > 0 ? (
                                /* Search Results */
                                <>
                                    {/* Desktop Grid */}
                                    <div className="hidden lg:flex lg:flex-wrap lg:justify-start lg:gap-6 mb-10 w-full max-w-[1200px]">
                                        {searchResults.map((experience, index) => (
                                            <ProductCard key={index} {...experience} />
                                        ))}
                                    </div>

                                    {/* Mobile Horizontal Scroll */}
                                    <div className="lg:hidden mb-10 w-full">
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start">
                                            {searchResults.map((experience, index) => (
                                                <ProductCard key={index} {...experience} />
                                            ))}
                                        </div>
                                    </div>
                                </>
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
                                    {loading ? 'Searching...' : `${searchResults.length} results for "${query}"`}
                                </p>
                            )}
                        </div>

                        {/* Filter */}
                        <div className="flex overflow-x-auto gap-4 mb-6 pb-2">
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

                        {loading ? (
                            /* Loading State */
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-1 mx-auto mb-4"></div>
                                    <p className="text-neutrals-4 text-sm">Searching for experiences...</p>
                                </div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            /* Search Results - Mobile Scroll */
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {searchResults.map((experience, index) => (
                                    <ProductCard key={index} {...experience} />
                                ))}
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