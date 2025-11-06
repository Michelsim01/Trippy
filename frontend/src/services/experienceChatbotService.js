const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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

class ExperienceChatbotService {
  // Create a new session
  async createSession(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/sessions`, {
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
      console.error('Create experience chat session API error:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  // Send a message to the chatbot
  async sendMessage(message, sessionId = null, context = null, userId = null) {
    try {
      // Use provided userId or fall back to localStorage
      const userIdToUse = userId || localStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/message`, {
        method: 'POST',
        headers: getAuthHeaders(userIdToUse),
        credentials: 'include',
        body: JSON.stringify({
          message,
          sessionId,
          context,
          chatbotType: 'experienceRecommendation'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Send experience chat message API error:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Get session history
  async getSessionHistory(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/sessions/${sessionId}`, {
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
      console.error('Get experience chat session API error:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  // Delete a session
  async deleteSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  // Get user sessions
  async getUserSessions(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/users/${userId}/sessions`, {
        method: 'GET',
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
      console.error('Error fetching user sessions:', error);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  // Get conversation suggestions
  async getConversationSuggestions() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/suggestions`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  }

  // Check chatbot health
  async getHealthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experience-chatbot/health`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw new Error(`Failed to check health: ${error.message}`);
    }
  }

}

export default new ExperienceChatbotService();