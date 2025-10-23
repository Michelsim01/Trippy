import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid for protected routes
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Don't redirect automatically, let the component handle it
        }
        return Promise.reject(error);
    }
);

/**
 * Get dashboard metrics for a guide
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Object>} Dashboard metrics including monthly bookings, cancellation rate, and total experiences
 */
export const getDashboardMetrics = async (guideId) => {
    try {
        const response = await api.get(`/api/guide-analytics/${guideId}/dashboard-metrics`);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw error;
    }
};

/**
 * Get profit trend chart data for the last 6 months
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Array>} Array of monthly profit data
 */
export const getProfitChartData = async (guideId) => {
    try {
        const response = await api.get(`/api/guide-analytics/${guideId}/profit-chart`);
        return response.data;
    } catch (error) {
        console.error('Error fetching profit chart data:', error);
        throw error;
    }
};

/**
 * Get top performing experiences sorted by booking volume
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Array>} Array of top experiences with booking counts
 */
export const getTopExperiences = async (guideId) => {
    try {
        const response = await api.get(`/api/guide-analytics/${guideId}/top-experiences`);
        return response.data;
    } catch (error) {
        console.error('Error fetching top experiences:', error);
        throw error;
    }
};

/**
 * Get all analytics data for a guide in one call
 * @param {number} guideId - The guide's user ID
 * @returns {Promise<Object>} Complete analytics data
 */
export const getAllAnalytics = async (guideId) => {
    try {
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
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
    }
};

export default {
    getDashboardMetrics,
    getProfitChartData,
    getTopExperiences,
    getAllAnalytics
};
