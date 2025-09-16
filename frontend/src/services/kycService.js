import api from './kycApi.js';

export const kycService = {
  // Submit KYC document
  async submitKyc(userId, formData) {
    try {
      // Transform frontend form data to match backend KycDocument structure
      const kycDocument = {
        docType: formData.idType === 'other' ? formData.otherIdType : formData.idType,
        docSide: 'front', // Default value, can be extended for file upload
        fileUrl: null, // Will be updated when file upload is implemented
        notes: `Name: ${formData.fullName}, DOB: ${formData.dob}, Nationality: ${formData.nationality}, ID: ${formData.idNumber}, Email: ${formData.email}, Mobile: ${formData.mobileCountry}${formData.mobileNumber}`
      };

      const response = await api.post(`/kyc/submit?userId=${userId}`, kycDocument);
      return response.data;
    } catch (error) {
      console.error('KYC submission error:', error);
      throw new Error(error.message || 'Failed to submit KYC application');
    }
  },

  // Get KYC status
  async getKycStatus(userId) {
    try {
      const response = await api.get(`/kyc/status?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get KYC status error:', error);
      throw new Error(error.message || 'Failed to get KYC status');
    }
  },

  // Approve KYC (admin function)
  async approveKyc(userId) {
    try {
      const response = await api.post(`/kyc/approve?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('KYC approval error:', error);
      throw new Error(error.message || 'Failed to approve KYC');
    }
  },

  // Reject KYC (admin function)
  async rejectKyc(userId, reason) {
    try {
      const response = await api.post(`/kyc/reject?userId=${userId}&reason=${encodeURIComponent(reason)}`);
      return response.data;
    } catch (error) {
      console.error('KYC rejection error:', error);
      throw new Error(error.message || 'Failed to reject KYC');
    }
  }
};