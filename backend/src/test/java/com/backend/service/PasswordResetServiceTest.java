package com.backend.service;

import com.backend.entity.User;
import com.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock(lenient = true)
    private UserRepository userRepository;

    @Mock(lenient = true)
    private PasswordEncoder passwordEncoder;

    @Mock(lenient = true)
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = createTestUser(1L, "test@example.com");
    }

    @Test
    void testGeneratePasswordResetToken_ValidEmail_GeneratesTokenAndSendsEmail() throws Exception {
        // Arrange
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        String token = passwordResetService.generatePasswordResetToken("test@example.com");

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertNotNull(testUser.getPasswordResetToken());
        assertNotNull(testUser.getPasswordResetTokenExpiresAt());
        assertTrue(testUser.getPasswordResetTokenExpiresAt().isAfter(LocalDateTime.now()));
        verify(userRepository).save(testUser);
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), anyString(), eq("Test"), any(Boolean.class));
    }

    @Test
    void testGeneratePasswordResetToken_InvalidEmail_ThrowsException() {
        // Arrange
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(Exception.class,
            () -> passwordResetService.generatePasswordResetToken("nonexistent@example.com"));
        assertEquals("User not found with email: nonexistent@example.com", exception.getMessage());
        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString(), any(Boolean.class));
    }

    @Test
    void testValidatePasswordResetToken_ValidToken_ReturnsTrue() {
        // Arrange
        String validToken = "valid-token-123";
        testUser.setPasswordResetToken(validToken);
        testUser.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
        when(userRepository.findByPasswordResetToken(validToken)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = passwordResetService.validatePasswordResetToken(validToken);

        // Assert
        assertTrue(result);
        verify(userRepository).findByPasswordResetToken(validToken);
    }

    @Test
    void testValidatePasswordResetToken_ExpiredToken_ReturnsFalse() {
        // Arrange
        String expiredToken = "expired-token-123";
        testUser.setPasswordResetToken(expiredToken);
        testUser.setPasswordResetTokenExpiresAt(LocalDateTime.now().minusHours(1)); // Expired
        when(userRepository.findByPasswordResetToken(expiredToken)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = passwordResetService.validatePasswordResetToken(expiredToken);

        // Assert
        assertFalse(result);
        verify(userRepository).findByPasswordResetToken(expiredToken);
    }

    @Test
    void testValidatePasswordResetToken_InvalidToken_ReturnsFalse() {
        // Arrange
        String invalidToken = "invalid-token-123";
        when(userRepository.findByPasswordResetToken(invalidToken)).thenReturn(Optional.empty());

        // Act
        boolean result = passwordResetService.validatePasswordResetToken(invalidToken);

        // Assert
        assertFalse(result);
        verify(userRepository).findByPasswordResetToken(invalidToken);
    }

    @Test
    void testResetPassword_ValidToken_ResetsPasswordAndClearsToken() throws Exception {
        // Arrange
        String validToken = "valid-token-123";
        String newPassword = "newPassword123";
        String encodedPassword = "encoded-password";
        
        testUser.setPasswordResetToken(validToken);
        testUser.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
        
        when(userRepository.findByPasswordResetToken(validToken)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(newPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        passwordResetService.resetPassword(validToken, newPassword);

        // Assert
        assertEquals(encodedPassword, testUser.getPassword());
        assertNull(testUser.getPasswordResetToken());
        assertNull(testUser.getPasswordResetTokenExpiresAt());
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
        verify(emailService).sendPasswordChangedConfirmation("test@example.com", "Test");
    }

    @Test
    void testResetPassword_InvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid-token-123";
        String newPassword = "newPassword123";
        when(userRepository.findByPasswordResetToken(invalidToken)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(Exception.class,
            () -> passwordResetService.resetPassword(invalidToken, newPassword));
        assertEquals("Invalid or expired reset token", exception.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testClearExpiredTokens_RemovesExpiredTokens() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        User expiredUser1 = createTestUser(2L, "expired1@example.com");
        User expiredUser2 = createTestUser(3L, "expired2@example.com");
        
        expiredUser1.setPasswordResetToken("expired-token-1");
        expiredUser1.setPasswordResetTokenExpiresAt(now.minusHours(2));
        expiredUser2.setPasswordResetToken("expired-token-2");
        expiredUser2.setPasswordResetTokenExpiresAt(now.minusHours(1));
        
        List<User> expiredUsers = Arrays.asList(expiredUser1, expiredUser2);
        when(userRepository.findByPasswordResetTokenExpiresAtBefore(any(LocalDateTime.class)))
            .thenReturn(expiredUsers);

        // Act
        passwordResetService.clearExpiredTokens();

        // Assert
        assertNull(expiredUser1.getPasswordResetToken());
        assertNull(expiredUser1.getPasswordResetTokenExpiresAt());
        assertNull(expiredUser2.getPasswordResetToken());
        assertNull(expiredUser2.getPasswordResetTokenExpiresAt());
        verify(userRepository, times(2)).save(any(User.class));
    }

    // Helper methods
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setPassword("oldPassword");
        return user;
    }
}