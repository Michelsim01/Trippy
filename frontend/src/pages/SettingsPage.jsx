

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProfileSettings from '../components/settings/ProfileSection';
import LoginSection from '../components/settings/LoginSection';
import CreditCardSection from '../components/settings/CreditCardSection';
import NotificationsSection from '../components/settings/NotificationsSection';
import PrivacySection from '../components/settings/PrivacySection';
import AccountSection from '../components/settings/AccountSection';

const SettingsPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddCard, setShowAddCard] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const sectionTabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'login', label: 'Login' },
        { id: 'credit-card', label: 'Credit Card' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'privacy', label: 'Privacy' },
        { id: 'account', label: 'Account' },
    ];

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);
    const toggleAddCard = () => setShowAddCard((prev) => !prev);

    // Scroll to section and set active tab
    const handleTabClick = (id) => {
        setActiveTab(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Listen to scroll to update active tab
    React.useEffect(() => {
        const handleScroll = () => {
            const offsets = sectionTabs.map(tab => {
                const el = document.getElementById(tab.id);
                if (!el) return { id: tab.id, top: Infinity };
                const rect = el.getBoundingClientRect();
                return { id: tab.id, top: Math.abs(rect.top - 80) }; // 80px offset for navbar
            });
            const closest = offsets.reduce((a, b) => (a.top < b.top ? a : b));
            setActiveTab(closest.id);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
        // eslint-disable-next-line
    }, []);

    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-1">
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
                </div>
                <div className="flex-1 w-full transition-all duration-300 flex flex-col">
                    <Navbar
                        isAuthenticated={true}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={toggleSidebar}
                    />
                    <main className="w-full p-8 flex-1">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-3xl font-bold text-neutrals-1 mb-8">Settings</h1>
                            <div className="max-w-6xl mx-auto flex gap-8">
                                {/* Left Tab Panel */}
                                <div className="w-64 flex-shrink-0">
                                    <div className="space-y-2 sticky top-28">
                                        {sectionTabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabClick(tab.id)}
                                                className={`w-full text-left px-6 py-3 rounded-full font-medium transition-colors capitalize ${activeTab === tab.id
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
                                <div className="flex-1 space-y-8">
                                    <div id="profile"><ProfileSettings /></div>
                                    <div id="login"><LoginSection /></div>
                                    <div id="credit-card"><CreditCardSection showAddCard={showAddCard} toggleAddCard={toggleAddCard} /></div>
                                    <div id="notifications"><NotificationsSection /></div>
                                    <div id="privacy"><PrivacySection /></div>
                                    <div id="account"><AccountSection /></div>
                                </div>
                            </div>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full flex flex-col min-h-screen">
                <Navbar
                    isAuthenticated={true}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                <main className="w-full p-4 flex-1">
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-6">Settings</h1>
                    <div className="space-y-6">
                        <div id="profile"><ProfileSettings /></div>
                        <div id="login"><LoginSection /></div>
                        <div id="credit-card"><CreditCardSection showAddCard={showAddCard} toggleAddCard={toggleAddCard} /></div>
                        <div id="notifications"><NotificationsSection /></div>
                        <div id="privacy"><PrivacySection /></div>
                        <div id="account"><AccountSection /></div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};
export default SettingsPage;


