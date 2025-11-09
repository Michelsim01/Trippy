const API_BASE_URL = 'http://localhost:8080/api';

const getAuthHeaders = (userId) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(userId && { 'User-ID': userId.toString() })
  };
  return headers;
};

export const experienceReportService = {
  createReport: async ({ reporterUserId, experienceId, reason, description }) => {
    const res = await fetch(`${API_BASE_URL}/experience-reports`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(reporterUserId),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        experienceId,
        reason,
        description,
      }),
      credentials: 'include'
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      // If response is not JSON, it's likely a network error
      throw new Error('Network error: Unable to connect to server');
    }
    
    if (!res.ok) {
      const errorMessage = data.error || data.message || `Failed to submit report (${res.status})`;
      throw new Error(errorMessage);
    }
    return data;
  },
};

