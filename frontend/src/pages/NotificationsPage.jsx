import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';

const NotificationsPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('messages');

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Placeholder data for notifications
    const notifications = {
        messages: [
            { id: 1, text: 'You have received a message from John!', time: '1 Aug 2025 12:00', isNew: true },
            { id: 2, text: 'You have received a message from John!', time: '1 Aug 2025 12:00', isNew: true },
            { id: 3, text: 'You have received a message from John!', time: '1 Aug 2025 12:00', isNew: true },
            { id: 4, text: 'You have received a message from John!', time: '1 Aug 2025 12:00', isNew: false },
            { id: 5, text: 'You have received a message from John!', time: '1 Aug 2025 12:00', isNew: false },
        ],
        tours: [
            { id: 1, text: 'New tour booking from Sarah', time: '2 Aug 2025 14:30', isNew: true },
            { id: 2, text: 'Tour confirmation for Tokyo trip', time: '1 Aug 2025 09:15', isNew: false },
        ],
        reviews: [
            { id: 1, text: 'New review received for your tour', time: '3 Aug 2025 16:45', isNew: true },
            { id: 2, text: 'Review response needed', time: '2 Aug 2025 11:20', isNew: false },
        ]
    };

    const tabs = [
        { id: 'messages', label: 'Messages' },
        { id: 'tours', label: 'Tours' },
        { id: 'reviews', label: 'Reviews' }
    ];

    const renderNotifications = () => {
        const currentNotifications = notifications[activeTab] || [];
        
        if (currentNotifications.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-neutrals-4">No notifications in this category</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {currentNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-4 bg-white rounded-lg hover:bg-neutrals-7 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-neutrals-2 font-medium">{notification.text}</p>
                                    {notification.isNew && (
                                        <div className="w-2 h-2 bg-primary-1 rounded-full flex-shrink-0"></div>
                                    )}
                                </div>
                                <p className="text-neutrals-4 text-sm">{notification.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
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
                            <h1 className="text-3xl font-bold text-neutrals-1 mb-8">Notifications</h1>
                            
                            <div className="flex gap-8">
                                {/* Left Tab Panel */}
                                <div className="w-64 flex-shrink-0">
                                    <div className="space-y-2">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full text-left px-6 py-3 rounded-full font-medium transition-colors ${
                                                    activeTab === tab.id
                                                        ? 'bg-neutrals-1 text-white'
                                                        : 'text-neutrals-4 hover:text-neutrals-2 hover:bg-neutrals-7'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Content Panel */}
                                <div className="flex-1">
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-neutrals-2 capitalize">
                                            {activeTab}
                                        </h2>
                                    </div>
                                    {renderNotifications()}
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
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-6">Notifications</h1>
                    
                    {/* Mobile Tab Navigation */}
                    <div className="flex gap-2 mb-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-neutrals-1 text-white'
                                        : 'text-neutrals-4 hover:text-neutrals-2 bg-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-neutrals-2 capitalize">
                            {activeTab}
                        </h2>
                    </div>
                    {renderNotifications()}
                </main>
            </div>
        </div>
    );
};

export default NotificationsPage;