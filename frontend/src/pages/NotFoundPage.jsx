import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const NotFoundPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
                </div>

                <div className="flex-1 w-full transition-all duration-300">
                    <Navbar
                        isAuthenticated={true}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={toggleSidebar}
                    />
                    <main className="w-full flex-1 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                        <div className="text-center max-w-2xl mx-auto px-8">
                            {/* 404 Graphic */}
                            <div className="mb-8">
                                <div className="relative">
                                    <h1 className="text-[120px] lg:text-[160px] font-bold text-neutrals-6 leading-none select-none">
                                        404
                                    </h1>
                                </div>
                            </div>

                            {/* Error Message */}
                            <div className="mb-8">
                                <h2 className="text-[32px] lg:text-[40px] font-bold text-neutrals-1 leading-[40px] lg:leading-[48px] tracking-[-0.32px] mb-4">
                                    Oops! Page Not Found
                                </h2>
                                <p className="text-[16px] text-neutrals-4 leading-[24px] max-w-lg mx-auto">
                                    The page you're looking for seems to have wandered off on its own adventure. 
                                    Let's get you back to discovering amazing experiences.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/home"
                                    className="bg-primary-1 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-1/90 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                        <polyline points="9,22 9,12 15,12 15,22"/>
                                    </svg>
                                    Back to Home
                                </Link>
                                <button
                                    onClick={() => window.history.back()}
                                    className="border-2 border-neutrals-6 text-neutrals-2 px-8 py-3 rounded-lg font-medium hover:border-neutrals-4 hover:text-neutrals-1 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                                    </svg>
                                    Go Back
                                </button>
                            </div>

                            {/* Helpful Links */}
                            <div className="mt-12">
                                <p className="text-[14px] text-neutrals-4 mb-4">
                                    Or explore these popular sections:
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <Link
                                        to="/search"
                                        className="text-[14px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                    >
                                        Search Experiences
                                    </Link>
                                    <Link
                                        to="/wishlist"
                                        className="text-[14px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                    >
                                        My Wishlist
                                    </Link>
                                    <Link
                                        to="/about"
                                        className="text-[14px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                    >
                                        About Us
                                    </Link>
                                    <Link
                                        to="/contact"
                                        className="text-[14px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                    >
                                        Contact Support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </main>
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
                
                <main className="w-full flex-1 flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
                    <div className="text-center w-full">
                        {/* Mobile 404 Graphic */}
                        <div className="mb-6">
                            <div className="relative">
                                <h1 className="text-[80px] font-bold text-neutrals-6 leading-none select-none">
                                    404
                                </h1>
                            </div>
                        </div>

                        {/* Mobile Error Message */}
                        <div className="mb-6">
                            <h2 className="text-[24px] font-bold text-neutrals-1 leading-[32px] tracking-[-0.24px] mb-3">
                                Oops! Page Not Found
                            </h2>
                            <p className="text-[14px] text-neutrals-4 leading-[20px]">
                                The page you're looking for seems to have wandered off. Let's get you back on track.
                            </p>
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/home"
                                className="bg-primary-1 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-1/90 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                                Back to Home
                            </Link>
                            <button
                                onClick={() => window.history.back()}
                                className="border-2 border-neutrals-6 text-neutrals-2 px-6 py-3 rounded-lg font-medium hover:border-neutrals-4 hover:text-neutrals-1 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                Go Back
                            </button>
                        </div>

                        {/* Mobile Helpful Links */}
                        <div className="mt-8">
                            <p className="text-[12px] text-neutrals-4 mb-3">
                                Or explore these sections:
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Link
                                    to="/search"
                                    className="text-[12px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                >
                                    Search
                                </Link>
                                <Link
                                    to="/wishlist"
                                    className="text-[12px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                >
                                    Wishlist
                                </Link>
                                <Link
                                    to="/about"
                                    className="text-[12px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                >
                                    About
                                </Link>
                                <Link
                                    to="/contact"
                                    className="text-[12px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                >
                                    Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default NotFoundPage;
