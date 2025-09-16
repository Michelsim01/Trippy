# KYC Document Upload Feature

## Overview
This document describes the implementation of the KYC (Know Your Customer) document upload functionality that allows users to upload their identification documents during the verification process.

## Backend Implementation

### New Endpoints Added to KycController

1. **POST `/api/kyc/upload-document`**
   - Uploads a KYC document file
   - Parameters: file (MultipartFile), userId, docType, docSide
   - Validates file type (JPG, PNG, PDF) and size (max 10MB)
   - Stores files in `uploads/kyc-documents/` directory
   - Returns file URL for frontend use

2. **GET `/api/kyc/documents/{filename}`**
   - Serves uploaded KYC documents
   - Protected endpoint for viewing uploaded documents

3. **POST `/api/kyc/submit-with-document`**
   - Alternative submission endpoint that includes document URL
   - Parameters: userId, docType, docSide, fileUrl, notes

### File Storage
- Documents are stored in `backend/uploads/kyc-documents/`
- File naming convention: `kyc_user_{userId}_{docType}_{docSide}_{uuid}.{extension}`
- Supported formats: JPG, PNG, PDF
- Maximum file size: 10MB

## Frontend Implementation

### KycVerificationPage Updates

1. **New State Variables**
   - `documentFile`: Stores the selected file object
   - `documentFileUrl`: Stores the backend URL after upload
   - `uploadingDocument`: Loading state for upload process

2. **File Upload Process**
   - User selects file → Immediate validation → Auto-upload → URL stored
   - Real-time feedback with loading states and error messages
   - Success confirmation with option to upload different file

3. **Validation**
   - File type validation (JPG, PNG, PDF only)
   - File size validation (max 10MB)
   - Required field validation in step 2
   - ID type dependency (clears document if ID type changes)

### KycService Updates

1. **uploadDocument(userId, file, docType, docSide)**
   - Handles file upload to backend
   - Returns file URL and upload status

2. **submitKycWithDocument(userId, formData, fileUrl)**
   - Enhanced submission that includes document information
   - Used when document is uploaded

## User Experience Flow

1. **Step 1**: User fills personal information
2. **Step 2**: User fills identification details and uploads document
   - Select ID type first (required for proper file naming)
   - Upload document (automatic validation and upload)
   - Visual feedback for upload status
3. **Step 3**: Review all information including document status
   - Shows "✓ Uploaded" or "✗ Not uploaded" status
   - Final submission includes document URL

## Security Considerations

1. **File Validation**
   - Type validation (only image and PDF files)
   - Size validation (10MB limit)
   - Malicious file prevention

2. **Authentication**
   - All endpoints require proper JWT authentication
   - Files are associated with user IDs
   - Secure file storage outside web root

3. **Access Control**
   - Document viewing requires authentication
   - Users can only access their own documents

## Error Handling

1. **Upload Errors**
   - Invalid file type
   - File too large
   - Network/server errors
   - Clear error messages to user

2. **Submission Errors**
   - Missing document
   - Authentication failures
   - Server errors

## Future Enhancements

1. **Multiple Document Support**
   - Front and back of ID cards
   - Additional supporting documents

2. **Document Processing**
   - OCR for automatic field population
   - Document verification APIs

3. **Admin Panel**
   - View uploaded documents
   - Approve/reject with document review

## Testing

To test the feature:

1. Start backend server
2. Navigate to KYC verification page
3. Fill steps 1 and 2
4. Upload a test document (JPG, PNG, or PDF < 10MB)
5. Verify upload success and proceed to step 3
6. Submit the complete application

## Files Modified

### Backend
- `KycController.java` - Added upload endpoints
- Created `uploads/kyc-documents/` directory

### Frontend
- `KycVerificationPage.jsx` - Added upload UI and logic
- `kycService.js` - Added upload methods
- `kycApi.js` - Fixed token authentication

### Configuration
- No additional configuration required
- Uses existing file upload patterns from profile pictures
