package com.backend.service;

import com.backend.entity.KycDocument;
import com.backend.entity.KycStatus;
import com.backend.entity.StatusType;
import com.backend.entity.User;
import com.backend.repository.KycDocumentRepository;
import com.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycServiceTest {

    @Mock(lenient = true)
    private UserRepository userRepository;

    @Mock(lenient = true)
    private KycDocumentRepository kycDocumentRepository;

    @InjectMocks
    private KycService kycService;

    private User testUser;
    private KycDocument testKycDocument;

    @BeforeEach
    void setUp() {
        testUser = createTestUser(1L, "test@example.com");
        testKycDocument = createTestKycDocument();
    }

    @Test
    void testSubmitKyc_ValidUser_CreatesKycAndUpdatesUserStatus() {
        // Arrange
        Long userId = 1L;
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(testKycDocument);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = kycService.submitKyc(userId, testKycDocument);

        // Assert
        assertNotNull(result);
        assertEquals(KycStatus.PENDING, result.getKycStatus());
        verify(kycDocumentRepository).save(testKycDocument);
        verify(userRepository).save(testUser);
        assertEquals(testUser, testKycDocument.getUser());
        assertEquals(StatusType.PENDING, testKycDocument.getStatus());
        assertNotNull(testKycDocument.getSubmittedAt());
    }

    @Test
    void testSubmitKyc_UserNotFound_ThrowsException() {
        // Arrange
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
            () -> kycService.submitKyc(userId, testKycDocument));
        assertEquals("User not found", exception.getMessage());
        verify(kycDocumentRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testGetKycStatus_ExistingUser_ReturnsUserKycStatus() {
        // Arrange
        Long userId = 1L;
        testUser.setKycStatus(KycStatus.APPROVED);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act
        KycStatus result = kycService.getKycStatus(userId);

        // Assert
        assertEquals(KycStatus.APPROVED, result);
        verify(userRepository).findById(userId);
    }

    @Test
    void testGetKycStatus_NonExistentUser_ReturnsNotStarted() {
        // Arrange
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act
        KycStatus result = kycService.getKycStatus(userId);

        // Assert
        assertEquals(KycStatus.NOT_STARTED, result);
        verify(userRepository).findById(userId);
    }

    @Test
    void testGetKycStatusDetails_WithKycDocument_ReturnsCompleteDetails() {
        // Arrange
        Long userId = 1L;
        testUser.setKycStatus(KycStatus.APPROVED);
        testKycDocument.setSubmittedAt(LocalDateTime.now().minusDays(1));
        testKycDocument.setReviewedAt(LocalDateTime.now());
        
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(kycDocumentRepository.findTopByUserOrderBySubmittedAtDesc(testUser)).thenReturn(testKycDocument);

        // Act
        Map<String, Object> result = kycService.getKycStatusDetails(userId);

        // Assert
        assertNotNull(result);
        assertEquals("APPROVED", result.get("kycStatus"));
        assertNotNull(result.get("submittedAt"));
        assertNotNull(result.get("reviewedAt"));
        assertEquals(testKycDocument.getRejectionReason(), result.get("rejectionReason"));
    }

    @Test
    void testApproveKyc_ValidUser_UpdatesStatusAndDocument() {
        // Arrange
        Long userId = 1L;
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(kycDocumentRepository.findTopByUserOrderBySubmittedAtDesc(testUser)).thenReturn(testKycDocument);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(testKycDocument);

        // Act
        kycService.approveKyc(userId);

        // Assert
        assertEquals(KycStatus.APPROVED, testUser.getKycStatus());
        assertEquals(StatusType.APPROVED, testKycDocument.getStatus());
        assertEquals(StatusType.PENDING, testKycDocument.getPreviousStatus());
        assertNotNull(testKycDocument.getReviewedAt());
        verify(userRepository).save(testUser);
        verify(kycDocumentRepository).save(testKycDocument);
    }

    @Test
    void testRejectKyc_ValidUserWithReason_UpdatesStatusAndDocument() {
        // Arrange
        Long userId = 1L;
        String rejectionReason = "Document not clear";
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(kycDocumentRepository.findTopByUserOrderBySubmittedAtDesc(testUser)).thenReturn(testKycDocument);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(testKycDocument);

        // Act
        kycService.rejectKyc(userId, rejectionReason);

        // Assert
        assertEquals(KycStatus.REJECTED, testUser.getKycStatus());
        assertEquals(StatusType.REJECTED, testKycDocument.getStatus());
        assertEquals(rejectionReason, testKycDocument.getRejectionReason());
        assertEquals(StatusType.PENDING, testKycDocument.getPreviousStatus());
        assertNotNull(testKycDocument.getReviewedAt());
        verify(userRepository).save(testUser);
        verify(kycDocumentRepository).save(testKycDocument);
    }

    // Helper methods
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setKycStatus(KycStatus.NOT_STARTED);
        return user;
    }

    private KycDocument createTestKycDocument() {
        KycDocument kycDoc = new KycDocument();
        kycDoc.setKycDocumentId(1L);
        kycDoc.setDocType("PASSPORT");
        kycDoc.setDocSide("front");
        kycDoc.setFileUrl("/uploads/kyc-documents/test-doc.jpg");
        kycDoc.setStatus(StatusType.PENDING);
        return kycDoc;
    }
}