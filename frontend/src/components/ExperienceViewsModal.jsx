import React, { useState, useEffect } from 'react';
import { getExperienceViews } from '../services/guideAnalyticsService';

/**
 * ExperienceViewsModal Component
 * Displays view metrics for a specific experience
 
 */
const ExperienceViewsModal = ({
    isOpen,
    onClose,
    experienceTitle,
    experienceId,
    guideId
}) => {
    const [viewData, setViewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch view data when modal opens
    useEffect(() => {
        const fetchViewData = async () => {
            if (!isOpen || !experienceId || !guideId) return;

            try {
                setLoading(true);
                setError(null);

                // Call real backend API
                const data = await getExperienceViews(experienceId, guideId);

                // Format the data for display
                const formattedData = {
                    totalViews: data.totalViews || 0,
                    totalBookings: data.totalBookings || 0,
                    chatInquiries: data.chatInquiries || 0,
                    wishlistAdds: data.wishlistAdds || 0,
                    averagePartySize: typeof data.averagePartySize === 'number'
                        ? data.averagePartySize.toFixed(1)
                        : data.averagePartySize || '0.0',
                    conversionRate: typeof data.conversionRate === 'number'
                        ? data.conversionRate.toFixed(1)
                        : data.conversionRate || '0.0'
                };

                setViewData(formattedData);
            } catch (error) {
                console.error('Error fetching view data:', error);
                setError(error.message || 'Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchViewData();
    }, [isOpen, experienceId, guideId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                    <div>
                        <h2 className="text-xl font-semibold text-neutrals-1">
                            {experienceTitle} - View Analytics
                        </h2>
                        <p className="text-sm text-neutrals-4 mt-1">
                            Track how your experience is performing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutrals-7 transition-colors"
                    >
                        <svg className="w-5 h-5 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-1"></div>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">Loading view data...</h3>
                            <p className="text-neutrals-4">Please wait while we fetch your analytics.</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">Error loading view data</h3>
                            <p className="text-neutrals-4">{error}</p>
                        </div>
                    ) : viewData ? (
                        <div className="space-y-6">
                            {/* Key Metrics Cards - Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Total Views */}
                                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-blue-900">Total Views</h3>
                                            <p className="text-2xl font-bold text-blue-600">{viewData.totalViews}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-700">All-time page views</p>
                                </div>

                                {/* Total Bookings */}
                                <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-green-900">Total Bookings</h3>
                                            <p className="text-2xl font-bold text-green-600">{viewData.totalBookings}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-700">Confirmed reservations</p>
                                </div>

                                {/* Chat Inquiries */}
                                <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-purple-900">Chat Inquiries</h3>
                                            <p className="text-2xl font-bold text-purple-600">{viewData.chatInquiries}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-purple-700">Messages from interested users</p>
                                </div>
                            </div>

                            {/* Key Metrics Cards - Row 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Wishlist Adds */}
                                <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-yellow-900">Wishlist Adds</h3>
                                            <p className="text-2xl font-bold text-yellow-600">{viewData.wishlistAdds}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-yellow-700">Users who saved this experience</p>
                                </div>

                                {/* Average Party Size */}
                                <div className="bg-cyan-50 p-5 rounded-lg border border-cyan-200">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-cyan-900">Avg Party Size</h3>
                                            <p className="text-2xl font-bold text-cyan-600">{viewData.averagePartySize}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-cyan-700">Average guests per booking</p>
                                </div>
                            </div>

                            {/* Conversion Rate Section */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutrals-1 mb-1">Conversion Rate</h3>
                                        <p className="text-sm text-neutrals-4">Percentage of views that resulted in bookings</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold text-indigo-600">{viewData.conversionRate}%</div>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            {viewData.totalBookings} bookings / {viewData.totalViews} views
                                        </p>
                                    </div>
                                </div>

                                {/* Conversion Rate Bar */}
                                <div className="mt-4">
                                    <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${viewData.conversionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Insights */}
                            <div className="bg-neutrals-8 p-5 rounded-lg border border-neutrals-6">
                                <h3 className="text-lg font-semibold text-neutrals-1 mb-4 flex items-center">
                                    <svg className="w-5 h-5 text-primary-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Performance Insights
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm text-neutrals-2">
                                                <span className="font-semibold">Good engagement:</span> Your experience has {viewData.chatInquiries} chat inquiries, showing strong interest from potential customers.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm text-neutrals-2">
                                                <span className="font-semibold">Visibility:</span> With {viewData.totalViews} views, your experience is getting noticed by travelers.
                                            </p>
                                        </div>
                                    </div>
                                    {parseFloat(viewData.conversionRate) > 5 ? (
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                            <div>
                                                <p className="text-sm text-neutrals-2">
                                                    <span className="font-semibold">Above average:</span> Your {viewData.conversionRate}% conversion rate is performing well! Keep up the great work.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                            <div>
                                                <p className="text-sm text-neutrals-2">
                                                    <span className="font-semibold">Opportunity:</span> Try improving your photos, description, or pricing to increase your conversion rate.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ExperienceViewsModal;
