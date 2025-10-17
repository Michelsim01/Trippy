package com.backend.controller;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.dto.response.RegistrationResponse;
import com.backend.entity.User;
import com.backend.repository.UserRepository;
import com.backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for AuthController.
 * Tests controller logic in isolation with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Authentication service is running"));
    }

    @Test
    void testUserRegistration_Success() throws Exception {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123");

        RegistrationResponse mockResponse = new RegistrationResponse(
            true, 
            "Registration successful! Please check your email to verify your account.", 
            "test@example.com"
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful! Please check your email to verify your account."))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        // Verify service was called
        verify(authService).register(any(RegisterRequest.class));
    }

        @Test
    void testUserLogin_Success() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("login@example.com");
        loginRequest.setPassword("Password123");

        AuthResponse mockResponse = new AuthResponse(
            "mock-jwt-token",
            "Bearer",
            "Login User",
            "login@example.com",
            List.of("ROLE_TRAVELER"),
            true,
            1L
        );

        when(userRepository.findByEmail("login@example.com")).thenReturn(Optional.of(new User()));
        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.username").value("Login User"))
                .andExpect(jsonPath("$.email").value("login@example.com"))
                .andExpect(jsonPath("$.emailVerified").value(true))
                .andExpect(jsonPath("$.roles").isArray())
                .andExpect(jsonPath("$.userId").value(1));

        // Verify service was called
        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    void testRegistrationWithInvalidData() throws Exception {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName(""); // Empty
        registerRequest.setLastName(""); // Empty
        registerRequest.setEmail("invalid-email"); // Invalid email
        registerRequest.setPassword("123"); // Too short, no uppercase/lowercase

        // Since we're using standalone MockMvc, validation happens at Spring level
        // but the GlobalExceptionHandler should catch it and return the first error message
        
        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());

        // In unit testing with standalone setup, the service won't be called due to validation failure
        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    void testLoginWithInvalidCredentials() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new AuthenticationException("Invalid credentials") {});

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid email or password"));

        // Verify service was called
        verify(authService).login(any(LoginRequest.class));
    }

            @Test
    void testDuplicateEmailRegistration() throws Exception {
        // Arrange
        RegisterRequest duplicateUser = new RegisterRequest();
        duplicateUser.setFirstName("New");
        duplicateUser.setLastName("User");
        duplicateUser.setEmail("duplicate@example.com");
        duplicateUser.setPassword("Password123");

        when(authService.register(any(RegisterRequest.class)))
            .thenThrow(new Exception("User with email duplicate@example.com already exists"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateUser)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Registration failed: User with email duplicate@example.com already exists"));

        // Verify service was called
        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void testUserRegistrationWithPendingVerification() throws Exception {
        // Arrange
        RegisterRequest userRequest = new RegisterRequest();
        userRequest.setFirstName("Pending");
        userRequest.setLastName("User");
        userRequest.setEmail("pending@example.com");
        userRequest.setPassword("Password123");

        RegistrationResponse mockResponse = new RegistrationResponse(
            true,
            "Registration successful! Please check your email to verify your account.",
            "pending@example.com"
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(userRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful! Please check your email to verify your account."))
                .andExpect(jsonPath("$.email").value("pending@example.com"));

        // Verify service was called
        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void testLoginWithSuspendedAccount() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("suspended@example.com");
        loginRequest.setPassword("Password123");

        User suspendedUser = new User();
        suspendedUser.setEmail("suspended@example.com");
        suspendedUser.setIsActive(false); // Account is suspended

        when(userRepository.findByEmail("suspended@example.com")).thenReturn(Optional.of(suspendedUser));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ACCOUNT_SUSPENDED"))
                .andExpect(jsonPath("$.message").value("Your account has been suspended. Please contact support to appeal."));

        // Verify repository was called but service was not (because suspended check happens first)
        verify(userRepository).findByEmail("suspended@example.com");
        verify(authService, never()).login(any(LoginRequest.class));
    }
}
