import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useState } from 'react';

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

const WishlistCard = ({ 
    title = "Venice, Rome & Milan", 
    location = "Karineside", 
    originalPrice = 699, 
    salePrice = 548, 
    rating = 4.9, 
    startDate = "Tue, Jul 20", 
    endDate = "Fri, Jul 23",
    image,
    showExplore = false,
    onRemoveFromWishlist
}) => {
    return (
        <div className="flex flex-col h-[365px] w-64 shrink-0">
            {/* Image Container */}
            <div className="relative flex-1 bg-neutrals-2 rounded-t-[16px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${image})` }}
                />
                
                {/* Explore Button - shows on some cards */}
                {showExplore && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button className="bg-white text-neutrals-1 px-6 py-2 rounded-full font-medium text-sm shadow-lg hover:bg-neutrals-7 transition-colors">
                            Explore
                        </button>
                    </div>
                )}
                
                {/* Wishlist Heart Button */}
                <button 
                    onClick={onRemoveFromWishlist}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-neutrals-7 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FD7FE9" />
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

const WishlistPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([
        { 
            id: 1,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[0],
            showExplore: false
        },
        { 
            id: 2,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[1],
            showExplore: true
        },
        { 
            id: 3,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[2],
            showExplore: false
        },
        { 
            id: 4,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[3],
            showExplore: false
        },
        { 
            id: 5,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[4],
            showExplore: false
        },
        { 
            id: 6,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[5],
            showExplore: true
        },
        { 
            id: 7,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[6],
            showExplore: false
        },
        { 
            id: 8,
            title: "Venice, Rome & Milan", 
            location: "Karineside", 
            originalPrice: 699, 
            salePrice: 548, 
            rating: 4.9,
            image: experienceImages[7],
            showExplore: false
        }
    ]);

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
                            
                            {wishlistItems.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-neutrals-3 text-lg">Your wishlist is empty. Start adding experiences you'd love to try!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {wishlistItems.map((item) => (
                                        <WishlistCard
                                            key={item.id}
                                            {...item}
                                            onRemoveFromWishlist={() => removeFromWishlist(item.id)}
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
                    
                    {wishlistItems.length === 0 ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-neutrals-3">Your wishlist is empty. Start adding experiences you'd love to try!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {wishlistItems.map((item) => (
                                <WishlistCard
                                    key={item.id}
                                    {...item}
                                    onRemoveFromWishlist={() => removeFromWishlist(item.id)}
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