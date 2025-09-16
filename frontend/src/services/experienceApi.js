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

export const experienceApi = {
  /**
   * Creates a new experience with all related data (itinerary, media, schedules)
   * @param {Object} payload - Complete experience payload from getBackendPayload()
   * @returns {Promise<Object>} Response containing experience data and ID
   */
  createExperience: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include', // For CORS
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create experience API error:', error);
      throw new Error(`Failed to create experience: ${error.message}`);
    }
  },

  /**
   * Gets all experiences
   * @returns {Promise<Array>} List of experiences
   */
  getAllExperiences: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get experiences API error:', error);
      throw new Error(`Failed to fetch experiences: ${error.message}`);
    }
  },

  /**
   * Gets a specific experience by ID
   * @param {number} experienceId - The experience ID
   * @returns {Promise<Object>} Experience data
   */
  getExperienceById: async (experienceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences/${experienceId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get experience API error:', error);
      throw new Error(`Failed to fetch experience: ${error.message}`);
    }
  },

  /**
   * Gets media for a specific experience
   * @param {number} experienceId - The experience ID
   * @returns {Promise<Array>} Experience media list
   */
  getExperienceMedia: async (experienceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences/${experienceId}/media`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get experience media API error:', error);
      throw new Error(`Failed to fetch experience media: ${error.message}`);
    }
  },

  /**
   * Gets itineraries for a specific experience
   * @param {number} experienceId - The experience ID
   * @returns {Promise<Array>} Experience itineraries list
   */
  getExperienceItineraries: async (experienceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences/${experienceId}/itineraries`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get experience itineraries API error:', error);
      throw new Error(`Failed to fetch experience itineraries: ${error.message}`);
    }
  },

  /**
   * Gets schedules for a specific experience
   * @param {number} experienceId - The experience ID
   * @returns {Promise<Array>} Experience schedules list
   */
  getExperienceSchedules: async (experienceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences/${experienceId}/schedules`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get experience schedules API error:', error);
      throw new Error(`Failed to fetch experience schedules: ${error.message}`);
    }
  },

  /**
   * Updates an existing experience with all related data (itinerary, media, schedules)
   * @param {number} experienceId - The experience ID to update
   * @param {Object} payload - Complete experience payload from getBackendPayload()
   * @returns {Promise<Object>} Response containing updated experience data
   */
  updateExperience: async (experienceId, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiences/${experienceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include', // For CORS
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update experience API error:', error);
      throw new Error(`Failed to update experience: ${error.message}`);
    }
  }
};

export default experienceApi;