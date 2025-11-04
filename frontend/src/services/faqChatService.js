const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = (userId) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(userId && { 'User-ID': userId.toString() })
  };
  return headers;
};

export const faqChatService = {
  /**
   * Send a message to the FAQ chatbot
   * @param {string} sessionId - Chat session ID
   * @param {string} message - User message
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Bot response
   */
  sendMessage: async (sessionId, message, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faq-chatbot/message`, {
        method: 'POST',
        headers: getAuthHeaders(userId),
        credentials: 'include',
        body: JSON.stringify({
          message,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Send FAQ chat message API error:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },

  /**
   * Create a new FAQ chatbot session
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Session data
   */
  createSession: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faq-chatbot/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(userId),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create FAQ chat session API error:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  },

  /**
   * Get session details
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session data with message history
   */
  getSession: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faq-chatbot/sessions/${sessionId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Session not found
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get FAQ chat session API error:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }
  },

  /**
   * Get messages for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session data with messages
   */
  getMessages: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faq-chatbot/sessions/${sessionId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Session not found
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get FAQ chat messages API error:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  },
};

