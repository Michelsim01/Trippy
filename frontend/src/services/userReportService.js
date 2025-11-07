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

export const userReportService = {
  createReport: async ({ reporterUserId, reportedUserId, reason, description }) => {
    const res = await fetch(`${API_BASE_URL}/user-reports`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(reporterUserId),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportedUserId,
        reason,
        description,
      }),
      credentials: 'include'
    });

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const errorMessage = data.error || data.message || `Failed to submit report (${res.status})`;
      throw new Error(errorMessage);
    }
    return data;
  },
};


