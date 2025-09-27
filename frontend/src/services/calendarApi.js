const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const calendarApi = {
  /**
   * Gets calendar events for a user (both as participant and guide)
   * @param {number} userId - The user ID
   * @param {string} startDate - Optional start date filter (ISO string)
   * @param {string} endDate - Optional end date filter (ISO string)
   * @returns {Promise<Object>} Calendar data with participant and guide events
   */
  getUserCalendarEvents: async (userId, startDate = null, endDate = null) => {
    try {
      let url = `${API_BASE_URL}/bookings/user/${userId}/calendar`;
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get calendar events API error:', error);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  },

  /**
   * Gets all events for a user in a specific month
   * @param {number} userId - The user ID
   * @param {number} year - Year (e.g., 2024)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Calendar data for the month
   */
  getUserMonthlyEvents: async (userId, year, month) => {
    try {
      // Create start and end dates for the month
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      
      return await calendarApi.getUserCalendarEvents(userId, startDate, endDate);
    } catch (error) {
      console.error('Get monthly events API error:', error);
      throw new Error(`Failed to fetch monthly events: ${error.message}`);
    }
  },

  /**
   * Gets events for a specific date range
   * @param {number} userId - The user ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Calendar data for the date range
   */
  getUserDateRangeEvents: async (userId, startDate, endDate) => {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      return await calendarApi.getUserCalendarEvents(userId, start, end);
    } catch (error) {
      console.error('Get date range events API error:', error);
      throw new Error(`Failed to fetch date range events: ${error.message}`);
    }
  },

  /**
   * Filters events by type and status
   * @param {Array} events - Array of events to filter
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered events
   */
  filterEvents: (events, filters = {}) => {
    if (!events || !Array.isArray(events)) return [];

    return events.filter(event => {
      // Filter by user role (participant, guide)
      if (filters.userRole && event.userRole !== filters.userRole) {
        return false;
      }

      // Filter by time period (past, upcoming)
      if (filters.timePeriod) {
        const now = new Date();
        const eventStart = new Date(event.startDateTime);
        
        if (filters.timePeriod === 'past' && eventStart >= now) {
          return false;
        }
        if (filters.timePeriod === 'upcoming' && eventStart < now) {
          return false;
        }
      }

      // Filter by status
      if (filters.status && event.status !== filters.status) {
        return false;
      }

      // Filter by category
      if (filters.category && event.category !== filters.category) {
        return false;
      }

      return true;
    });
  },

  /**
   * Groups events by date for calendar display
   * @param {Array} events - Array of events
   * @returns {Object} Events grouped by date (YYYY-MM-DD)
   */
  groupEventsByDate: (events) => {
    if (!events || !Array.isArray(events)) return {};

    return events.reduce((grouped, event) => {
      // Use local date to avoid timezone offset issues
      const eventDate = new Date(event.startDateTime);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(event);
      return grouped;
    }, {});
  },

  /**
   * Gets upcoming events (next 30 days)
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Upcoming events
   */
  getUpcomingEvents: async (userId) => {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      return await calendarApi.getUserDateRangeEvents(userId, now, thirtyDaysFromNow);
    } catch (error) {
      console.error('Get upcoming events API error:', error);
      throw new Error(`Failed to fetch upcoming events: ${error.message}`);
    }
  },

  /**
   * Gets past events (last 90 days)
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Past events
   */
  getPastEvents: async (userId) => {
    try {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      
      return await calendarApi.getUserDateRangeEvents(userId, ninetyDaysAgo, now);
    } catch (error) {
      console.error('Get past events API error:', error);
      throw new Error(`Failed to fetch past events: ${error.message}`);
    }
  }
};
