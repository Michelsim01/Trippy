import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProfitTrendChart from '../components/analytics/ProfitTrendChart';
import { getAllAnalytics } from '../services/guideAnalyticsService';

const GuideAnalyticsPage = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await getAllAnalytics(user?.id || user?.userId);
                setAnalyticsData(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id || user?.userId) {
            fetchAnalytics();
        }
    }, [user?.id, user?.userId]);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Helper function to format percentage change
    const formatChange = (changePercent) => {
        const isPositive = changePercent > 0;
        return {
            value: Math.abs(changePercent).toFixed(1),
            isPositive,
            className: isPositive ? 'text-green-600' : 'text-red-600',
            icon: isPositive ? '↑' : '↓'
        };
    };

    // Render metric card component with change percentage
    const MetricCard = ({ title, subtitle, currentValue, changePercent, icon, iconBg, valueColor }) => {
        const change = formatChange(changePercent);

        return (
            <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutrals-1">{title}</h3>
                            <p className="text-sm text-neutrals-4">{subtitle}</p>
                        </div>
                    </div>
                </div>
                <div className={`text-3xl font-bold ${valueColor} mb-2`}>
                    {currentValue}
                </div>
                <div className={`text-sm ${change.className} flex items-center gap-1`}>
                    <span>{change.icon}</span>
                    <span>{change.value}%</span>
                    <span className="text-neutrals-4">vs last month</span>
                </div>
            </div>
        );
    };

    // Render simple metric card without change percentage
    const SimpleMetricCard = ({ title, subtitle, value, icon, iconBg, valueColor }) => {
        return (
            <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutrals-1">{title}</h3>
                            <p className="text-sm text-neutrals-4">{subtitle}</p>
                        </div>
                    </div>
                </div>
                <div className={`text-3xl font-bold ${valueColor} mb-2`}>
                    {value}
                </div>
                <div className="text-sm text-neutrals-4">
                    Total published experiences
                </div>
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
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-neutrals-1 mb-2">Tour Analytics</h1>
                                <p className="text-neutrals-4">Track your performance and insights</p>
                            </div>

                            {loading ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-neutrals-3 text-lg">Loading analytics...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-red-500 text-lg mb-2">Error loading analytics: {error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn btn-outline-primary btn-md"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : analyticsData ? (
                                <>
                                    {/* Dashboard Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        <MetricCard
                                            title="Monthly Bookings"
                                            subtitle="Current month"
                                            currentValue={analyticsData.metrics.monthlyBookings.current}
                                            changePercent={analyticsData.metrics.monthlyBookings.changePercent}
                                            icon={
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            }
                                            iconBg="bg-blue-100"
                                            valueColor="text-blue-600"
                                        />

                                        <MetricCard
                                            title="Cancellation Rate"
                                            subtitle="Cancelled vs total bookings"
                                            currentValue={`${analyticsData.metrics.cancellationRate.current}%`}
                                            changePercent={analyticsData.metrics.cancellationRate.changePercent}
                                            icon={
                                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            }
                                            iconBg="bg-orange-100"
                                            valueColor="text-orange-600"
                                        />

                                        <SimpleMetricCard
                                            title="Total Experiences"
                                            subtitle="Published tours"
                                            value={analyticsData.metrics.totalExperiences}
                                            icon={
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            }
                                            iconBg="bg-purple-100"
                                            valueColor="text-purple-600"
                                        />
                                    </div>

                                    {/* Profit Trend Chart */}
                                    <div className="mb-8">
                                        <ProfitTrendChart
                                            data={analyticsData.profitData}
                                            title="Monthly Profit Trend (Last 6 Months)"
                                        />
                                    </div>

                                    {/* Top Performing Experiences */}
                                    <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Top Performing Experiences</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-neutrals-6">
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutrals-3">Experience</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutrals-3">Category</th>
                                                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutrals-3">Bookings</th>
                                                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutrals-3">Rating</th>
                                                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutrals-3">Conversion</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analyticsData.topExperiences.map((experience, index) => (
                                                        <tr key={index} className="border-b border-neutrals-6 hover:bg-neutrals-8 transition-colors">
                                                            <td className="py-3 px-4 text-sm text-neutrals-1 font-medium">{experience.name}</td>
                                                            <td className="py-3 px-4">
                                                                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-1 bg-opacity-10 text-primary-1">
                                                                    {experience.category}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-center text-sm font-semibold text-neutrals-1">{experience.bookings}</td>
                                                            <td className="py-3 px-4 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                                                                    </svg>
                                                                    <span className="text-sm font-semibold text-neutrals-1">{experience.rating}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center text-sm text-neutrals-3">{experience.conversionRate}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </main>
                    <div className="h-px bg-neutrals-6 w-full" />
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
                <main className="w-full p-4">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-neutrals-1 mb-2">Tour Analytics</h1>
                        <p className="text-neutrals-4">Track your performance and insights</p>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-neutrals-3">Loading analytics...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-red-500 mb-2">Error loading analytics: {error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-outline-primary btn-md"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : analyticsData ? (
                        <>
                            {/* Dashboard Metrics - Mobile */}
                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <MetricCard
                                    title="Monthly Bookings"
                                    subtitle="Current month"
                                    currentValue={analyticsData.metrics.monthlyBookings.current}
                                    changePercent={analyticsData.metrics.monthlyBookings.changePercent}
                                    icon={
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    }
                                    iconBg="bg-blue-100"
                                    valueColor="text-blue-600"
                                />

                                <MetricCard
                                    title="Cancellation Rate"
                                    subtitle="Cancelled vs total bookings"
                                    currentValue={`${analyticsData.metrics.cancellationRate.current}%`}
                                    changePercent={analyticsData.metrics.cancellationRate.changePercent}
                                    icon={
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    }
                                    iconBg="bg-orange-100"
                                    valueColor="text-orange-600"
                                />

                                <SimpleMetricCard
                                    title="Total Experiences"
                                    subtitle="Published tours"
                                    value={analyticsData.metrics.totalExperiences}
                                    icon={
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                    iconBg="bg-purple-100"
                                    valueColor="text-purple-600"
                                />
                            </div>

                            {/* Profit Trend Chart - Mobile */}
                            <div className="mb-6">
                                <ProfitTrendChart
                                    data={analyticsData.profitData}
                                    title="Monthly Profit Trend"
                                />
                            </div>

                            {/* Top Performing Experiences - Mobile */}
                            <div className="bg-white p-4 rounded-lg border border-neutrals-6 shadow-sm">
                                <h3 className="text-md font-semibold text-neutrals-1 mb-4">Top Performing Experiences</h3>
                                <div className="space-y-4">
                                    {analyticsData.topExperiences.map((experience, index) => (
                                        <div key={index} className="border-b border-neutrals-6 pb-4 last:border-b-0 last:pb-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-sm font-medium text-neutrals-1 flex-1">{experience.name}</h4>
                                                <span className="text-sm font-bold text-primary-1 ml-2">{experience.bookings} bookings</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-neutrals-4">
                                                <span className="inline-block px-2 py-1 rounded-full bg-primary-1 bg-opacity-10 text-primary-1 font-medium">
                                                    {experience.category}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                                                    </svg>
                                                    <span>{experience.rating}</span>
                                                </div>
                                                <span>{experience.conversionRate}% conversion</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : null}
                </main>
                <div className="h-px bg-neutrals-6 w-full" />
                <Footer />
            </div>
        </div>
    );
};

export default GuideAnalyticsPage;
