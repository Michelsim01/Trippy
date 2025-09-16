import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ExperienceCard from '../components/ExperienceCard';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Mock images for experiences
const experienceImages = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
];

const WishlistPage = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [schedules, setSchedules] = useState({}); // Store schedules by experience ID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fallback dummy data in case API fails
    const fallbackWishlistItems = [
        { 
            id: 1,
            experienceId: 1,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            price: 548, 
            rating: 4.9,
            imageUrl: experienceImages[0],
            showExplore: false
        }
    ];

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                setLoading(true);
                console.log('WishlistPage - Fetching wishlist for user:', user?.id || user?.userId);
                
                const response = await fetch(`http://localhost:8080/api/wishlist-items/user/${user?.id || user?.userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('WishlistPage - Fetched wishlist data:', data);
                console.log('WishlistPage - Wishlist items count:', data.length);
                
                // Transform the API data to match our component structure
                const transformedData = data.map(item => ({
                    id: item.wishlistItemId,
                    experienceId: item.experience.experienceId,
                    title: item.experience.title,
                    location: item.experience.location,
                    price: item.experience.price,
                    originalPrice: item.experience.price * 1.2, // Add some original price for demo
                    rating: item.experience.averageRating || 4.9,
                    imageUrl: item.experience.coverPhotoUrl || experienceImages[0],
                    showExplore: false,
                    addedAt: item.addedAt,
                    shortDescription: item.experience.shortDescription,
                    duration: item.experience.duration,
                    category: item.experience.category,
                    status: item.experience.status,
                    totalReviews: item.experience.totalReviews
                }));
                
                setWishlistItems(transformedData);
                
                // Fetch schedule data for all experiences in wishlist
                const schedulePromises = data.map(item => 
                    fetch(`http://localhost:8080/api/experiences/${item.experience.experienceId}/schedules`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => response.ok ? response.json() : [])
                        .catch(() => []) // If schedule fetch fails, use empty array
                );
                
                const schedulesData = await Promise.all(schedulePromises);
                
                // Create schedules object with experience ID as key
                const schedulesMap = {};
                data.forEach((item, index) => {
                    schedulesMap[item.experience.experienceId] = schedulesData[index];
                });
                
                setSchedules(schedulesMap);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch wishlist:", err);
                setError(err.message);
                // Fallback to dummy data
                setWishlistItems(fallbackWishlistItems);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id || user?.userId) {
            fetchWishlist();
        }
    }, [user?.id, user?.userId]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const removeFromWishlist = (itemId) => {
        setWishlistItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

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
                    <main className="w-full p-8">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-3xl font-bold text-neutrals-1 mb-8">Wishlist</h1>
                            
                            {loading ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-neutrals-3 text-lg">Loading your wishlist...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-red-500 text-lg mb-2">Error loading wishlist: {error}</p>
                                    <p className="text-neutrals-3 text-sm">Showing fallback data</p>
                                </div>
                            ) : wishlistItems.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-neutrals-3 text-lg">Your wishlist is empty. Start adding experiences you'd love to try!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {wishlistItems.map((item) => (
                                        <ExperienceCard
                                            key={item.id}
                                            experience={item}
                                            showWishlistButton={true}
                                            isInWishlist={true} // All items on wishlist page are in wishlist
                                            schedules={schedules[item.experienceId] || []}
                                            onWishlistToggle={(experienceId, wasAdded) => {
                                                // Note: We don't remove from local state immediately
                                                // The card stays visible until page refresh
                                                console.log(`Experience ${experienceId} ${wasAdded ? 'added to' : 'removed from'} wishlist`);
                                            }}
                                            showExplore={item.showExplore}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                    <div className="h-px bg-neutrals-6 w-full" />
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
                <main className="w-full p-4">
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-6">Wishlist</h1>
                    
                    {loading ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-neutrals-3">Loading your wishlist...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-red-500 mb-2">Error loading wishlist: {error}</p>
                            <p className="text-neutrals-3 text-sm">Showing fallback data</p>
                        </div>
                    ) : wishlistItems.length === 0 ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-neutrals-3">Your wishlist is empty. Start adding experiences you'd love to try!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {wishlistItems.map((item) => (
                                <ExperienceCard
                                    key={item.id}
                                    experience={item}
                                    showWishlistButton={true}
                                    isInWishlist={true} // All items on wishlist page are in wishlist
                                    schedules={schedules[item.experienceId] || []}
                                    onWishlistToggle={(experienceId, wasAdded) => {
                                        // Note: We don't remove from local state immediately
                                        // The card stays visible until page refresh
                                        console.log(`Experience ${experienceId} ${wasAdded ? 'added to' : 'removed from'} wishlist`);
                                    }}
                                    showExplore={item.showExplore}
                                />
                            ))}
                        </div>
                    )}
                </main>
                <div className="h-px bg-neutrals-6 w-full" />
                <Footer />
            </div>
        </div>
    );
};

export default WishlistPage;