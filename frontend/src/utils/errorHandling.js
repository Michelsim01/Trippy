// Utility functions for handling errors and redirecting to appropriate error pages

/**
 * Handle API response errors and redirect to appropriate error pages
 * @param {Response} response - The fetch response object
 * @param {function} navigate - React Router navigate function
 */
export const handleApiError = (response, navigate) => {
    if (!response.ok) {
        switch (response.status) {
            case 404:
                navigate('/404');
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                navigate('/500');
                break;
            default:
                // For other errors (401, 403, etc.), let the component handle them
                break;
        }
    }
};

/**
 * Handle generic errors and redirect to server error page
 * @param {Error} error - The error object
 * @param {function} navigate - React Router navigate function
 */
export const handleGenericError = (error, navigate) => {
    console.error('Application error:', error);
    navigate('/500');
};

/**
 * Wrapper for fetch requests that automatically handles error responses
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {function} navigate - React Router navigate function
 * @returns {Promise<Response>} - The fetch response
 */
export const fetchWithErrorHandling = async (url, options = {}, navigate) => {
    try {
        const response = await fetch(url, options);
        handleApiError(response, navigate);
        return response;
    } catch (error) {
        handleGenericError(error, navigate);
        throw error;
    }
};

/**
 * Check if the current route should redirect to 404
 * @param {string} pathname - Current path
 * @param {Array} validRoutes - Array of valid route patterns
 * @returns {boolean} - Whether to redirect to 404
 */
export const shouldRedirectTo404 = (pathname, validRoutes) => {
    return !validRoutes.some(route => {
        if (typeof route === 'string') {
            return pathname === route;
        }
        if (route instanceof RegExp) {
            return route.test(pathname);
        }
        return false;
    });
};

/**
 * Valid routes for the application - used to determine 404s
 */
export const VALID_ROUTES = [
    '/',
    '/signup',
    '/signin',
    '/forgot-password',
    '/reset-password',
    '/email-verification',
    '/verify-email',
    '/home',
    '/search',
    '/notifications',
    '/wishlist',
    '/messages',
    '/blog',
    '/my-bookings',
    '/create-experience',
    '/create-experience/basic-info',
    '/create-experience/details',
    '/create-experience/pricing',
    '/create-experience/availability',
    '/create-experience/success',
    '/experience-details',
    '/experience-details-test',
    '/calendar',
    '/about',
    '/contact',
    '/settings',
    '/kyc-onboarding',
    '/kyc-verification',
    '/kyc-submitted',
    '/404',
    '/500',
    // Dynamic routes (regex patterns)
    /^\/profile\/\d+$/,
    /^\/experience\/\d+$/,
    /^\/edit-experience\/\d+$/,
    /^\/edit-experience\/\d+\/(basic-info|details|pricing|availability)$/,
];
