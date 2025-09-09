import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AboutPage = () => {
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
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">About Trippy</h1>

                            {/* Hero section */}
                            <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-primary-1 rounded-full flex items-center justify-center">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" />
                                            <circle cx="12" cy="9" r="2.5" fill="#4AC63F" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-neutrals-1">Our Mission</h2>
                                </div>
                                <p className="text-lg text-neutrals-3 leading-relaxed">
                                    At Trippy, we believe that travel should be more than just visiting tourist attractions.
                                    We're dedicated to connecting travelers with authentic, local experiences that create
                                    lasting memories and meaningful connections with the places they visit.
                                </p>
                            </div>

                            {/* Features grid */}
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-primary-1 opacity-10 rounded-lg flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-primary-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-neutrals-1 mb-3">Discover Hidden Gems</h3>
                                    <p className="text-neutrals-4">
                                        Find unique experiences off the beaten path, curated by locals who know their destinations best.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-primary-1 opacity-10 rounded-lg flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-primary-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-neutrals-1 mb-3">Connect with Locals</h3>
                                    <p className="text-neutrals-4">
                                        Meet like-minded travelers and local hosts who share your passion for authentic experiences.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-primary-1 opacity-10 rounded-lg flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-primary-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-neutrals-1 mb-3">Verified Experiences</h3>
                                    <p className="text-neutrals-4">
                                        Every experience is carefully vetted to ensure quality, safety, and authenticity.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-primary-1 opacity-10 rounded-lg flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-primary-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-neutrals-1 mb-3">Sustainable Travel</h3>
                                    <p className="text-neutrals-4">
                                        Support local communities and promote responsible tourism that benefits everyone.
                                    </p>
                                </div>
                            </div>

                            {/* Team section */}
                            <div className="bg-white rounded-lg p-8 shadow-sm">
                                <h2 className="text-2xl font-semibold text-neutrals-1 mb-6">Our Story</h2>
                                <p className="text-neutrals-3 leading-relaxed mb-6">
                                    Founded in 2024, Trippy was born from the idea that the best travel experiences come from
                                    connecting with locals and immersing yourself in authentic culture. Our team of passionate
                                    travelers and technology enthusiasts work together to create a platform that makes
                                    discovering these experiences easier than ever.
                                </p>
                                <p className="text-neutrals-3 leading-relaxed">
                                    Whether you're looking for a cooking class with a local family, a guided hike through
                                    hidden trails, or a cultural workshop that few tourists know about, Trippy is here to
                                    help you create memories that will last a lifetime.
                                </p>
                            </div>
                        </div>
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
                <main className="w-full p-4">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">About Trippy</h1>

                        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary-1 rounded-full flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" />
                                        <circle cx="12" cy="9" r="2.5" fill="#4AC63F" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-neutrals-1">Our Mission</h2>
                            </div>
                            <p className="text-neutrals-3 leading-relaxed">
                                At Trippy, we believe that travel should be more than just visiting tourist attractions.
                                We're dedicated to connecting travelers with authentic, local experiences.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: 'Discover Hidden Gems', desc: 'Find unique experiences off the beaten path' },
                                { title: 'Connect with Locals', desc: 'Meet like-minded travelers and local hosts' },
                                { title: 'Verified Experiences', desc: 'Every experience is carefully vetted for quality' },
                                { title: 'Sustainable Travel', desc: 'Support local communities responsibly' }
                            ].map((feature, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                    <h3 className="font-semibold text-neutrals-1 mb-2">{feature.title}</h3>
                                    <p className="text-sm text-neutrals-4">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AboutPage;
