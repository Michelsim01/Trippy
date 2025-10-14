import api from './kycApi.js';

export const kycService = {
  // Upload KYC document
  async uploadDocument(userId, file, docType, docSide = 'front') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('docType', docType);
      formData.append('docSide', docSide);

      const response = await api.post('/kyc/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Document upload error:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload document');
    }
  },

  // Submit KYC application with all required data
  async submitKyc(userId, formData) {
    try {
      console.log('submitKyc called with userId:', userId, 'documentUrl:', formData.documentFileUrl);

      // Transform frontend form data to match backend KycDocument structure
      const kycDocument = {
        docType: formData.idType === 'other' ? formData.otherIdType : formData.idType,
        docSide: 'front',
        fileUrl: formData.documentFileUrl || null, // Required - document must be uploaded
        notes: `Name: ${formData.fullName}, DOB: ${formData.dob}, Nationality: ${formData.nationality}, ID: ${formData.idNumber}, Email: ${formData.email}, Mobile: ${formData.mobileCountry}${formData.mobileNumber}`
      };

      // Validate that document was uploaded
      if (!kycDocument.fileUrl) {
        throw new Error('Document upload is required for KYC submission');
      }

      console.log('Submitting to /kyc/submit with userId:', userId, 'and document:', kycDocument);

      const response = await api.post(`/kyc/submit?userId=${userId}`, kycDocument);
      return response.data;
    } catch (error) {
      console.error('KYC submission error:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || error.message || 'Failed to submit KYC application');
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