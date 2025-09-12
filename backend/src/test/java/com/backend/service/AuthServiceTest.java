package com.backend.service;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.entity.User;
import com.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for AuthService.
 * Tests the core authentication business logic.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // Clear database before each test
        userRepository.deleteAll();
    }

    @Test
    void testUserRegistration() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123");

        // When
        AuthResponse response = authService.register(registerRequest);

        // Then
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("Test User", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("ROLE_TRAVELER", response.getRoles().get(0));

        // Verify user was saved to database
        assertTrue(userRepository.findByEmail("test@example.com").isPresent());
        User savedUser = userRepository.findByEmail("test@example.com").get();
        assertEquals("Test", savedUser.getFirstName());
        assertEquals("User", savedUser.getLastName());
        assertEquals("test@example.com", savedUser.getEmail());
        assertTrue(passwordEncoder.matches("Password123", savedUser.getPassword()));
    }

    @Test
    void testUserLogin() throws Exception {
        // Given - Create a user first
        User user = new User();
        user.setEmail("login@example.com");
        user.setPassword(passwordEncoder.encode("Password123"));
        user.setFirstName("Login");
        user.setLastName("User");
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setIsAdmin(false);
        user.setCanCreateExperiences(false);
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("login@example.com");
        loginRequest.setPassword("Password123");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("Login User", response.getUsername());
        assertEquals("login@example.com", response.getEmail());
    }

    @Test
    void testRegistrationWithDuplicateEmail() {
        // Given - Create first user
        User existingUser = new User();
        existingUser.setEmail("duplicate@example.com");
        existingUser.setPassword(passwordEncoder.encode("Password123"));
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
        existingUser.setIsActive(true);
        userRepository.save(existingUser);

        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName("New");
        registerRequest.setLastName("User");
        registerRequest.setEmail("duplicate@example.com");
        registerRequest.setPassword("Password123");

        // When & Then
        Exception exception = assertThrows(Exception.class, () -> {
            authService.register(registerRequest);
        });

        assertTrue(exception.getMessage().contains("already exists"));
    }

    @Test
    void testLoginWithInvalidCredentials() {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("wrongpassword");

        // When & Then
        Exception exception = assertThrows(Exception.class, () -> {
            authService.login(loginRequest);
        });

        assertTrue(exception.getMessage().contains("Invalid credentials"));
    }

    @Test
    void testDefaultUserRole() throws Exception {
        // Test that all users are automatically assigned ROLE_TRAVELER
        RegisterRequest userRequest = new RegisterRequest();
        userRequest.setFirstName("Test");
        userRequest.setLastName("User");
        userRequest.setEmail("testuser@example.com");
        userRequest.setPassword("Password123");

        AuthResponse response = authService.register(userRequest);
        assertEquals("ROLE_TRAVELER", response.getRoles().get(0));
        
        // Verify user was saved to database
        assertTrue(userRepository.findByEmail("testuser@example.com").isPresent());
    }
}
