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

export const faqService = {
  /**
   * Get paginated FAQs from the knowledge base
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Number of items per page (default 10)
   * @param {string} category - Optional category filter
   * @returns {Promise<Object>} Paginated response with FAQs
   */
  getFAQs: async (page = 0, size = 10, category = null) => {
    try {
      let url = `${API_BASE_URL}/faqs?page=${page}&size=${size}&sourceType=faq`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      const response = await fetch(url, {
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
      console.error('Get FAQs API error:', error);
      throw new Error(`Failed to fetch FAQs: ${error.message}`);
    }
  },

  /**
   * Get all available FAQ categories
   * @returns {Promise<Array<string>>} List of category names
   */
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/faqs/categories?sourceType=faq`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Get FAQ categories API error:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  },
};

