import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const ServerErrorPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleRefresh = () => {
        window.location.reload();
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
                            {/* 500 Graphic */}
                            <div className="mb-8">
                                <div className="relative">
                                    <h1 className="text-[120px] lg:text-[160px] font-bold text-neutrals-6 leading-none select-none">
                                        500
                                    </h1>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            <div className="mb-8">
                                <h2 className="text-[32px] lg:text-[40px] font-bold text-neutrals-1 leading-[40px] lg:leading-[48px] tracking-[-0.32px] mb-4">
                                    Something Went Wrong
                                </h2>
                                <p className="text-[16px] text-neutrals-4 leading-[24px] max-w-lg mx-auto mb-4">
                                    We're experiencing some technical difficulties on our end. Our team has been notified and is working to fix this issue.
                                </p>
                                <div className="bg-neutrals-7 border border-neutrals-6 rounded-lg p-4 max-w-md mx-auto">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-[14px] font-medium text-neutrals-2">Server Error</span>
                                    </div>
                                    <p className="text-[12px] text-neutrals-4">
                                        Error Code: 500 - Internal Server Error
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleRefresh}
                                    className="bg-primary-1 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-1/90 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10"/>
                                        <polyline points="1 20 1 14 7 14"/>
                                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                    </svg>
                                    Try Again
                                </button>
                                <Link
                                    to="/home"
                                    className="border-2 border-neutrals-6 text-neutrals-2 px-8 py-3 rounded-lg font-medium hover:border-neutrals-4 hover:text-neutrals-1 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                        <polyline points="9,22 9,12 15,12 15,22"/>
                                    </svg>
                                    Back to Home
                                </Link>
                            </div>

                            {/* Support Information */}
                            <div className="mt-12">
                                <div className="bg-primary-1/5 border border-primary-1/20 rounded-lg p-6 max-w-md mx-auto">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-primary-1 rounded-full flex items-center justify-center">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                            </svg>
                                        </div>
                                        <h3 className="text-[16px] font-bold text-neutrals-1">Need Help?</h3>
                                    </div>
                                    <p className="text-[14px] text-neutrals-4 mb-4">
                                        If this problem persists, please contact our support team.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Link
                                            to="/contact"
                                            className="text-[14px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium inline-flex items-center justify-center gap-1 px-3 py-1"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                                <polyline points="22,6 12,13 2,6"/>
                                            </svg>
                                            Contact Support
                                        </Link>
                                        <span className="text-[14px] text-neutrals-4">or</span>
                                        <Link
                                            to="/about"
                                            className="text-[14px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                        >
                                            Visit Help Center
                                        </Link>
                                    </div>
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
                        {/* Mobile 500 Graphic */}
                        <div className="mb-6">
                            <div className="relative">
                                <h1 className="text-[80px] font-bold text-neutrals-6 leading-none select-none">
                                    500
                                </h1>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Error Message */}
                        <div className="mb-6">
                            <h2 className="text-[24px] font-bold text-neutrals-1 leading-[32px] tracking-[-0.24px] mb-3">
                                Something Went Wrong
                            </h2>
                            <p className="text-[14px] text-neutrals-4 leading-[20px] mb-4">
                                We're experiencing technical difficulties. Our team is working to fix this.
                            </p>
                            <div className="bg-neutrals-7 border border-neutrals-6 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-[12px] font-medium text-neutrals-2">Server Error</span>
                                </div>
                                <p className="text-[10px] text-neutrals-4">
                                    Error Code: 500
                                </p>
                            </div>
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRefresh}
                                className="bg-primary-1 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-1/90 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10"/>
                                    <polyline points="1 20 1 14 7 14"/>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                </svg>
                                Try Again
                            </button>
                            <Link
                                to="/home"
                                className="border-2 border-neutrals-6 text-neutrals-2 px-6 py-3 rounded-lg font-medium hover:border-neutrals-4 hover:text-neutrals-1 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                                Back to Home
                            </Link>
                        </div>

                        {/* Mobile Support Information */}
                        <div className="mt-8">
                            <div className="bg-primary-1/5 border border-primary-1/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-primary-1 rounded-full flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-[14px] font-bold text-neutrals-1">Need Help?</h3>
                                </div>
                                <p className="text-[12px] text-neutrals-4 mb-3">
                                    If this problem persists, contact support.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Link
                                        to="/contact"
                                        className="text-[12px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                    >
                                        Contact Support
                                    </Link>
                                    <Link
                                        to="/about"
                                        className="text-[12px] text-primary-1 hover:text-primary-1/80 transition-colors font-medium"
                                    >
                                        Help Center
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ServerErrorPage;
