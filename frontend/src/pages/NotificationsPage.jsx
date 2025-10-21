import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Trash } from 'lucide-react';

const Spinner = () => (
    <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-1 border-t-transparent"></div>
        <span className="text-neutrals-4 mt-4">Loading...</span>
    </div>
);

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('user');
    
    // Use the notifications hook
    const { 
        loading, 
        error, 
        categorizedNotifications, 
        markAsRead, 
        deleteNotification,
        getUnreadCountByCategory,
        fetchNotifications
    } = useNotifications();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const tabs = [
        { id: 'user', label: 'User' },
        { id: 'tours', label: 'Tours' },
        { id: 'reviews', label: 'Reviews' }
    ];

    const getTypeLabel = (type) => {
        const typeLabels = {
            'MESSAGE': 'Message',
            'BOOKING_CONFIRMATION': 'Booking Confirmation',
            'REMINDER': 'Reminder',
            'DISCOUNT': 'Discount',
            'REVIEW_REQUEST': 'Review Request',
            'PASSWORD_RESET': 'Password Reset',
            'UPDATE_INFO': 'Update Info',
            'BOOKING_CANCELLED': 'Booking Cancelled',
        };
        return typeLabels[type] || type;
    };

    const formatDateTime = (dateTimeString) => {
        return new Date(dateTimeString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderNotifications = () => {
        if (loading || authLoading) {
            return (
                <div className="text-center py-12">
                    <Spinner />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{error}</p>
                    {!isAuthenticated ? (
                        <button
                            onClick={() => navigate('/signin')}
                            className="px-4 py-2 bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors"
                        >
                            Sign In
                        </button>
                    ) : (
                        <button
                            onClick={fetchNotifications}
                            className="px-4 py-2 bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            );
        }

        const currentNotifications = categorizedNotifications[activeTab] || [];

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
                <div
                key={notification.notificationId}
                className={`p-4 bg-white rounded-lg hover:bg-neutrals-7 transition-colors cursor-pointer ${!notification.isRead ? 'border-l-4 border-primary-1' : ''
                    }`}
                onClick={async () => {
                    if (!notification.isRead) {
                    await markAsRead(notification.notificationId);
                    window.location.reload();
                    }
                }}
                >
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-neutrals-2 font-medium">
                    {notification.title || getTypeLabel(notification.type)}
                    </p>
                    {/* Green dot for unread notification */}
                    {!notification.isRead && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                </div>
                <p className="text-neutrals-2 mb-2">{notification.message}</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-neutrals-4 text-sm">
                    {formatDateTime(notification.createdAt)}
                    </p>
                    <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        const swal = await import('sweetalert2');
                        swal.default.fire({
                        title: 'Delete Notification?',
                        text: 'Are you sure you want to delete this notification?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it'
                        }).then((result) => {
                        if (result.isConfirmed) {
                            deleteNotification(notification.notificationId);
                        }
                        });
                    }}
                    className="text-red-500 hover:text-red-700 text-sm p-1 hover:bg-red-50 rounded"
                    >
                    <Trash size={16} color='var(--color-primary-3)' />
                    </button>
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
                        isAuthenticated={isAuthenticated}
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
                                                className={`w-full text-left px-6 py-3 rounded-full font-medium flex items-center justify-between transition-colors ${activeTab === tab.id
                                                        ? 'bg-neutrals-1 text-white'
                                                        : 'text-neutrals-4 hover:text-neutrals-2 hover:bg-neutrals-7'
                                                    }`}
                                            >
                                                <span>{tab.label}</span>
                                                {getUnreadCountByCategory(tab.id) > 0 && (
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">
                                                            {getUnreadCountByCategory(tab.id)}
                                                        </span>
                                                    </div>
                                                )}
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
                    isAuthenticated={isAuthenticated}
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
                                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
                                        ? 'bg-neutrals-1 text-white'
                                        : 'text-neutrals-4 hover:text-neutrals-2 bg-white'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {getUnreadCountByCategory(tab.id) > 0 && (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                            {getUnreadCountByCategory(tab.id)}
                                        </span>
                                    </div>
                                )}
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