import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useState } from 'react';

const ExperienceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Mock experience data - in a real app, this would be fetched from API
    const experience = {
        id: parseInt(id) || 1,
        title: "Venice, Rome & Milan Adventure",
        location: "Karineside",
        price: 548,
        originalPrice: 699,
        rating: 4.9,
        totalReviews: 127,
        duration: "4 days",
        category: "Cultural",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        shortDescription: "Discover the beauty of Italy's most iconic cities",
        fullDescription: "Embark on an unforgettable journey through Italy's most enchanting cities. From the romantic canals of Venice to the ancient wonders of Rome and the fashion capital of Milan, this 4-day adventure will immerse you in Italian culture, history, and cuisine.",
        highlights: [
            "Gondola ride through Venice canals",
            "Visit the Colosseum and Roman Forum",
            "Explore Milan's fashion district",
            "Taste authentic Italian cuisine",
            "Guided tours with local experts"
        ],
        whatIncluded: [
            "3 nights accommodation",
            "All transportation between cities",
            "Professional guide",
            "Entrance fees to major attractions",
            "Welcome dinner",
            "City maps and travel guides"
        ],
        importantInfo: [
            "Valid passport required",
            "Comfortable walking shoes recommended",
            "Weather-appropriate clothing",
            "Camera for memories"
        ]
    };

    const formatPrice = (price) => {
        return typeof price === 'number' ? Math.round(price) : price;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={toggleSidebar} />
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <main className="flex-grow container mx-auto px-4 py-8 lg:py-12">
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutrals-4 hover:text-neutrals-2 transition-colors mb-6"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Wishlist
                </button>

                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Image */}
                        <div className="relative">
                            <div
                                className="aspect-[4/3] bg-neutrals-2 rounded-[16px] overflow-hidden"
                                style={{ backgroundImage: `url(${experience.imageUrl})` }}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-primary-1 text-white text-sm font-medium rounded-full">
                                        {experience.category}
                                    </span>
                                    <span className="px-3 py-1 bg-neutrals-7 text-neutrals-3 text-sm font-medium rounded-full">
                                        {experience.duration}
                                    </span>
                                </div>
                                
                                <h1 className="text-3xl lg:text-4xl font-bold text-neutrals-1 mb-4">
                                    {experience.title}
                                </h1>
                                
                                <p className="text-lg text-neutrals-3 mb-6">
                                    {experience.shortDescription}
                                </p>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                                        </svg>
                                        <span className="font-semibold text-neutrals-1">{experience.rating}</span>
                                        <span className="text-neutrals-4">({experience.totalReviews} reviews)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                        <span className="text-neutrals-3">{experience.location}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price and Book Button */}
                            <div className="bg-neutrals-8 p-6 rounded-[16px] border border-neutrals-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        {experience.originalPrice && experience.originalPrice > experience.price && (
                                            <span className="text-lg text-neutrals-5 line-through block">
                                                ${formatPrice(experience.originalPrice)}
                                            </span>
                                        )}
                                        <span className="text-3xl font-bold text-primary-1">
                                            ${formatPrice(experience.price)}
                                        </span>
                                        <span className="text-neutrals-4 ml-2">per person</span>
                                    </div>
                                </div>
                                <button className="btn-primary w-full">
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description */}
                            <div>
                                <h2 className="text-2xl font-bold text-neutrals-1 mb-4">About this experience</h2>
                                <p className="text-neutrals-3 leading-relaxed">
                                    {experience.fullDescription}
                                </p>
                            </div>

                            {/* Highlights */}
                            <div>
                                <h2 className="text-2xl font-bold text-neutrals-1 mb-4">Highlights</h2>
                                <ul className="space-y-2">
                                    {experience.highlights.map((highlight, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-1 mt-0.5">
                                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="text-neutrals-3">{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* What's Included */}
                            <div className="bg-neutrals-8 p-6 rounded-[16px] border border-neutrals-6">
                                <h3 className="text-lg font-bold text-neutrals-1 mb-4">What's included</h3>
                                <ul className="space-y-2">
                                    {experience.whatIncluded.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-1 mt-1">
                                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="text-sm text-neutrals-3">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Important Info */}
                            <div className="bg-neutrals-8 p-6 rounded-[16px] border border-neutrals-6">
                                <h3 className="text-lg font-bold text-neutrals-1 mb-4">Important information</h3>
                                <ul className="space-y-2">
                                    {experience.importantInfo.map((info, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-4 mt-1">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                            <span className="text-sm text-neutrals-3">{info}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ExperienceDetailPage;
