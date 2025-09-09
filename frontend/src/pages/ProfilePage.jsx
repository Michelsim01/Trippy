import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';

const ProfilePage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const userAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80";

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
                            <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Profile</h1>
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="flex items-center gap-6 mb-6">
                                    <img
                                        src={userAvatar}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-neutrals-1">John Doe</h2>
                                        <p className="text-neutrals-3">john.doe@email.com</p>
                                        <p className="text-neutrals-4 text-sm">Member since 2024</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-neutrals-7 p-4 rounded-lg">
                                        <h3 className="font-semibold text-neutrals-1 mb-2">Trips Taken</h3>
                                        <p className="text-2xl font-bold text-primary-1">5</p>
                                    </div>
                                    <div className="bg-neutrals-7 p-4 rounded-lg">
                                        <h3 className="font-semibold text-neutrals-1 mb-2">Wishlist Items</h3>
                                        <p className="text-2xl font-bold text-primary-1">12</p>
                                    </div>
                                </div>
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
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-4">Profile</h1>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={userAvatar}
                                alt="Profile"
                                className="w-16 h-16 rounded-full object-cover"
                            />
                            <div>
                                <h2 className="text-lg font-semibold text-neutrals-1">John Doe</h2>
                                <p className="text-neutrals-3 text-sm">john.doe@email.com</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutrals-7 p-3 rounded-lg text-center">
                                <h3 className="font-semibold text-neutrals-1 text-sm">Trips</h3>
                                <p className="text-xl font-bold text-primary-1">5</p>
                            </div>
                            <div className="bg-neutrals-7 p-3 rounded-lg text-center">
                                <h3 className="font-semibold text-neutrals-1 text-sm">Wishlist</h3>
                                <p className="text-xl font-bold text-primary-1">12</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
