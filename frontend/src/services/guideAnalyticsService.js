// Guide Analytics Service with Mock Data
// This service returns hardcoded mock data for Phase 1 frontend development

/**
 * Get dashboard metrics for a guide
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Object>} Dashboard metrics including monthly bookings, cancellation rate, and total experiences
 */
export const getDashboardMetrics = async (guideId) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        monthlyBookings: {
            current: 45,
            previous: 38,
            changePercent: 18.4
        },
        cancellationRate: {
            current: 8.2,
            previous: 12.1,
            changePercent: -32.2 // Negative means improvement
        },
        totalExperiences: {
            current: 8,
            previous: 6,
            changePercent: 33.3
        }
    };
};

/**
 * Get profit trend chart data for the last 6 months
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Array>} Array of monthly profit data
 */
export const getProfitChartData = async (guideId) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
        { month: 'May', profit: 1200 },
        { month: 'Jun', profit: 1450 },
        { month: 'Jul', profit: 1680 },
        { month: 'Aug', profit: 1520 },
        { month: 'Sep', profit: 1890 },
        { month: 'Oct', profit: 2100 }
    ];
};

/**
 * Get top performing experiences sorted by booking volume
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Array>} Array of top experiences with booking counts
 */
export const getTopExperiences = async (guideId) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
        {
            name: 'Sunrise Mountain Hike',
            bookings: 28,
            rating: 4.8,
            category: 'Adventure',
            conversionRate: 12.5 // bookings / views percentage
        },
        {
            name: 'Local Food Walking Tour',
            bookings: 22,
            rating: 4.6,
            category: 'Culinary',
            conversionRate: 10.2
        },
        {
            name: 'Historic City Walk',
            bookings: 18,
            rating: 4.7,
            category: 'Cultural',
            conversionRate: 9.8
        },
        {
            name: 'Beach Sunset Experience',
            bookings: 15,
            rating: 4.9,
            category: 'Nature',
            conversionRate: 11.3
        },
        {
            name: 'Art Gallery Tour',
            bookings: 12,
            rating: 4.5,
            category: 'Cultural',
            conversionRate: 8.5
        }
    ];
};

/**
 * Get all analytics data for a guide in one call
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Object>} Complete analytics data
 */
export const getAllAnalytics = async (guideId) => {
    // Fetch all data in parallel
    const [metrics, profitData, topExperiences] = await Promise.all([
        getDashboardMetrics(guideId),
        getProfitChartData(guideId),
        getTopExperiences(guideId)
    ]);

    return {
        metrics,
        profitData,
        topExperiences
    };
};

export default {
    getDashboardMetrics,
    getProfitChartData,
    getTopExperiences,
    getAllAnalytics
};
