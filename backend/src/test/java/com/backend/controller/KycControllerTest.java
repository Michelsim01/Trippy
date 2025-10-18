package com.backend.controller;

import com.backend.entity.KycDocument;
import com.backend.entity.User;
import com.backend.service.KycService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for KycController.
 * Tests KYC document upload, status checking, and approval/rejection operations.
 */
@ExtendWith(MockitoExtension.class)
class KycControllerTest {

    @Mock
    private KycService kycService;

    @InjectMocks
    private KycController kycController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(kycController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Upload KYC document should return success response")
    void testUploadKycDocument_Success() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", 
                "test-document.jpg", 
                "image/jpeg", 
                "test content".getBytes()
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/kyc/upload-document")
                        .file(file)
                        .param("userId", "1")
                        .param("docType", "passport")
                        .param("docSide", "front"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("KYC document uploaded successfully"))
                .andExpect(jsonPath("$.fileName").exists())
                .andExpect(jsonPath("$.fileUrl").exists());
    }

    @Test
    @DisplayName("Upload empty file should return bad request")
    void testUploadKycDocument_EmptyFile() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", 
                "test.jpg", 
                "image/jpeg", 
                new byte[0]
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/kyc/upload-document")
                        .file(emptyFile)
                        .param("userId", "1")
                        .param("docType", "passport"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No file selected"));
    }

    @Test
    @DisplayName("Upload invalid file type should return bad request")
    void testUploadKycDocument_InvalidFileType() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", 
                "test.txt", 
                "text/plain", 
                "test content".getBytes()
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/kyc/upload-document")
                        .file(file)
                        .param("userId", "1")
                        .param("docType", "passport"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only image files (JPG, PNG) and PDF files are allowed"));
    }

    @Test
    @DisplayName("Upload file too large should return bad request")
    void testUploadKycDocument_FileTooLarge() throws Exception {
        // Arrange
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file", 
                "large-file.jpg", 
                "image/jpeg", 
                largeContent
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/kyc/upload-document")
                        .file(largeFile)
                        .param("userId", "1")
                        .param("docType", "passport"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("File size too large. Maximum 10MB allowed"));
    }

    @Test
    @DisplayName("Submit KYC should return success response")
    void testSubmitKyc_Success() throws Exception {
        // Arrange
        KycDocument kycDoc = new KycDocument();
        kycDoc.setFileUrl("/api/kyc/documents/test-document.jpg");

        User mockUser = new User();
        when(kycService.submitKyc(eq(1L), any(KycDocument.class))).thenReturn(mockUser);

        // Act & Assert
        mockMvc.perform(post("/api/kyc/submit")
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(kycDoc)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("KYC submitted successfully"));

        verify(kycService).submitKyc(eq(1L), any(KycDocument.class));
    }

    @Test
    @DisplayName("Submit KYC without file URL should return bad request")
    void testSubmitKyc_NoFileUrl() throws Exception {
        // Arrange
        KycDocument kycDoc = new KycDocument();
        // No file URL set

        // Act & Assert
        mockMvc.perform(post("/api/kyc/submit")
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(kycDoc)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Document upload is required for KYC submission"));

        verify(kycService, never()).submitKyc(anyLong(), any(KycDocument.class));
    }

    @Test
    @DisplayName("Submit KYC with service exception should return internal server error")
    void testSubmitKyc_ServiceException() throws Exception {
        // Arrange
        KycDocument kycDoc = new KycDocument();
        kycDoc.setFileUrl("/api/kyc/documents/test-document.jpg");

        when(kycService.submitKyc(eq(1L), any(KycDocument.class)))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        mockMvc.perform(post("/api/kyc/submit")
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(kycDoc)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to submit KYC"));

        verify(kycService).submitKyc(eq(1L), any(KycDocument.class));
    }

    @Test
    @DisplayName("Get KYC status should return status details")
    void testGetKycStatus_Success() throws Exception {
        // Arrange
        Map<String, Object> statusDetails = new HashMap<>();
        statusDetails.put("status", "PENDING");
        statusDetails.put("submittedAt", "2024-01-01T10:00:00");
        
        when(kycService.getKycStatusDetails(1L)).thenReturn(statusDetails);

        // Act & Assert
        mockMvc.perform(get("/api/kyc/status")
                        .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.submittedAt").value("2024-01-01T10:00:00"));

        verify(kycService).getKycStatusDetails(1L);
    }

    @Test
    @DisplayName("Approve KYC should return success response")
    void testApproveKyc_Success() throws Exception {
        // Arrange
        doNothing().when(kycService).approveKyc(1L);

        // Act & Assert
        mockMvc.perform(post("/api/kyc/approve")
                        .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(content().string("KYC approved"));

        verify(kycService).approveKyc(1L);
    }

    @Test
    @DisplayName("Reject KYC should return success response")
    void testRejectKyc_Success() throws Exception {
        // Arrange
        String reason = "Invalid document";
        doNothing().when(kycService).rejectKyc(1L, reason);

        // Act & Assert
        mockMvc.perform(post("/api/kyc/reject")
                        .param("userId", "1")
                        .param("reason", reason))
                .andExpect(status().isOk())
                .andExpect(content().string("KYC rejected: " + reason));

        verify(kycService).rejectKyc(1L, reason);
    }

    @Test
    @DisplayName("Get KYC document should return not found for non-existent file")
    void testGetKycDocument_NotFound() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/kyc/documents/non-existent-file.jpg"))
                .andExpect(status().isNotFound());
    }
}