package com.backend.controller;

import com.backend.dto.request.ForgotPasswordRequest;
import com.backend.dto.request.ResetPasswordRequest;
import com.backend.service.PasswordResetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetControllerTest {

    @Mock
    private PasswordResetService passwordResetService;

    @InjectMocks
    private PasswordResetController passwordResetController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(passwordResetController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void forgotPassword_Success() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        when(passwordResetService.generatePasswordResetToken(anyString())).thenReturn("generated-token");

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password reset instructions have been sent to your email address."));

        verify(passwordResetService).generatePasswordResetToken("test@example.com");
    }

    @Test
    void forgotPassword_UserNotFound() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nonexistent@example.com");

        when(passwordResetService.generatePasswordResetToken(anyString()))
                .thenThrow(new RuntimeException("User not found"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("No account found with that email address."));

        verify(passwordResetService).generatePasswordResetToken("nonexistent@example.com");
    }

    @Test
    void forgotPassword_GeneralError() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        when(passwordResetService.generatePasswordResetToken(anyString()))
                .thenThrow(new RuntimeException("Email service error"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Failed to send password reset instructions. Please try again."));

        verify(passwordResetService).generatePasswordResetToken("test@example.com");
    }

    @Test
    void validateResetToken_ValidToken() throws Exception {
        // Arrange
        String token = "valid-token";
        when(passwordResetService.validatePasswordResetToken(token)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/auth/validate-reset-token")
                .param("token", token))
                .andExpect(status().isOk())
                .andExpect(content().string("Token is valid"));

        verify(passwordResetService).validatePasswordResetToken(token);
    }

    @Test
    void validateResetToken_InvalidToken() throws Exception {
        // Arrange
        String token = "invalid-token";
        when(passwordResetService.validatePasswordResetToken(token)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/auth/validate-reset-token")
                .param("token", token))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid or expired token"));

        verify(passwordResetService).validatePasswordResetToken(token);
    }

    @Test
    void validateResetToken_Exception() throws Exception {
        // Arrange
        String token = "problematic-token";
        when(passwordResetService.validatePasswordResetToken(token))
                .thenThrow(new RuntimeException("Token validation error"));

        // Act & Assert
        mockMvc.perform(get("/api/auth/validate-reset-token")
                .param("token", token))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid or expired token"));

        verify(passwordResetService).validatePasswordResetToken(token);
    }

    @Test
    void resetPassword_Success() throws Exception {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("newPassword123");

        doNothing().when(passwordResetService).resetPassword(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password has been reset successfully"));

        verify(passwordResetService).resetPassword("valid-token", "newPassword123");
    }

    @Test
    void resetPassword_InvalidToken() throws Exception {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("invalid-token");
        request.setNewPassword("newPassword123");

        doThrow(new RuntimeException("Invalid token")).when(passwordResetService)
                .resetPassword(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid or expired reset token"));

        verify(passwordResetService).resetPassword("invalid-token", "newPassword123");
    }
}