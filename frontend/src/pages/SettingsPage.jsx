

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
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
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddCard, setShowAddCard] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Fetch user data
    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if user is authenticated
            if (!isAuthenticated || !token || !user?.id) {
                setError('You must be logged in to access settings');
                setLoading(false);
                return;
            }
            
            const response = await userService.getUserById(user.id);
            
            if (response.success) {
                setUserData(response.data);
                setError(null);
            } else {
                // Handle different error types
                if (response.status === 401) {
                    setError('Authentication required. Please log in again.');
                    // Redirect to login after a delay
                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                } else {
                    setError(response.error || 'Failed to load user settings');
                }
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('An unexpected error occurred while loading settings');
        } finally {
            setLoading(false);
        }
    };

    // Update user data callback for child components
    const handleUserDataUpdate = (newUserData) => {
        setUserData(newUserData);
    };

    const handleTabClick = (id) => {
        setActiveTab(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Handle authentication and data fetching
    useEffect(() => {
        // Don't fetch data if auth is still loading
        if (authLoading) {
            return;
        }
        
        // If user is not authenticated, show error
        if (!isAuthenticated) {
            setError('You must be logged in to access settings');
            setLoading(false);
            return;
        }
        
        // If authenticated, fetch user data
        fetchUserData();
    }, [isAuthenticated, authLoading, user]);

    // Scroll handling for tab navigation
    useEffect(() => {
        const handleScroll = () => {
            const offsets = sectionTabs.map(tab => {
                const el = document.getElementById(tab.id);
                if (!el) return { id: tab.id, top: Infinity };
                const rect = el.getBoundingClientRect();
                return { id: tab.id, top: Math.abs(rect.top - 80) };
            });
            const closest = offsets.reduce((a, b) => (a.top < b.top ? a : b));
            setActiveTab(closest.id);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Show loading state
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                    <p className="text-neutrals-3">
                        {authLoading ? 'Checking authentication...' : 'Loading settings...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !userData) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    {!isAuthenticated ? (
                        <button 
                            onClick={() => navigate('/signin')}
                            className="btn btn-primary"
                        >
                            Sign In
                        </button>
                    ) : (
                        <button 
                            onClick={fetchUserData}
                            className="btn btn-primary"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-1">
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
                </div>
                <div className="flex-1 w-full transition-all duration-300 flex flex-col">
                    <Navbar
                        isAuthenticated={isAuthenticated}
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
                                    <div id="profile">
                                        <ProfileSettings 
                                            userData={userData} 
                                            onUserDataUpdate={handleUserDataUpdate}
                                        />
                                    </div>
                                    <div id="login">
                                        <LoginSection 
                                            userData={userData} 
                                            onUserDataUpdate={handleUserDataUpdate}
                                        />
                                    </div>
                                    <div id="credit-card">
                                        <CreditCardSection 
                                            showAddCard={showAddCard} 
                                            toggleAddCard={toggleAddCard} 
                                            userData={userData}
                                        />
                                    </div>
                                    <div id="notifications">
                                        <NotificationsSection 
                                            userData={userData} 
                                            onUserDataUpdate={handleUserDataUpdate}
                                        />
                                    </div>
                                    <div id="privacy">
                                        <PrivacySection 
                                            userData={userData} 
                                            onUserDataUpdate={handleUserDataUpdate}
                                        />
                                    </div>
                                    <div id="account">
                                        <AccountSection 
                                            userData={userData} 
                                            onUserDataUpdate={handleUserDataUpdate}
                                        />
                                    </div>
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
                    isAuthenticated={isAuthenticated}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                <main className="w-full p-4 flex-1">
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-6">Settings</h1>
                    <div className="space-y-6">
                        <div id="profile">
                            <ProfileSettings 
                                userData={userData} 
                                onUserDataUpdate={handleUserDataUpdate}
                            />
                        </div>
                        <div id="login">
                            <LoginSection 
                                userData={userData} 
                                onUserDataUpdate={handleUserDataUpdate}
                            />
                        </div>
                        <div id="credit-card">
                            <CreditCardSection 
                                showAddCard={showAddCard} 
                                toggleAddCard={toggleAddCard} 
                                userData={userData}
                            />
                        </div>
                        <div id="notifications">
                            <NotificationsSection 
                                userData={userData} 
                                onUserDataUpdate={handleUserDataUpdate}
                            />
                        </div>
                        <div id="privacy">
                            <PrivacySection 
                                userData={userData} 
                                onUserDataUpdate={handleUserDataUpdate}
                            />
                        </div>
                        <div id="account">
                            <AccountSection 
                                userData={userData} 
                                onUserDataUpdate={handleUserDataUpdate}
                            />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};
export default SettingsPage;