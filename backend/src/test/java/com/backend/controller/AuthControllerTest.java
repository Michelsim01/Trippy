package com.backend.controller;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.entity.User;
import com.backend.repository.UserRepository;
import com.backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for AuthController endpoints.
 * Tests user registration, login, and authentication flow.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Transactional
public class AuthControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        objectMapper = new ObjectMapper();
        
        // Clear database before each test
        userRepository.deleteAll();
    }

    @Test
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Authentication service is running"));
    }

    @Test
    void testUserRegistration() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123");
        registerRequest.setRole("TRAVELER");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.username").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_TRAVELER"));

        // Verify user was saved to database
        assert userRepository.findByEmail("test@example.com").isPresent();
    }

    @Test
    void testUserLogin() throws Exception {
        // First create a user
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

        // Now test login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("login@example.com");
        loginRequest.setPassword("Password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.username").value("Login User"))
                .andExpect(jsonPath("$.email").value("login@example.com"));
    }

    @Test
    void testRegistrationWithInvalidData() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("ab"); // Too short
        registerRequest.setFirstName(""); // Empty
        registerRequest.setLastName(""); // Empty
        registerRequest.setEmail("invalid-email"); // Invalid email
        registerRequest.setPassword("123"); // Too short
        registerRequest.setRole("INVALID_ROLE"); // Invalid role

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testLoginWithInvalidCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testDuplicateEmailRegistration() throws Exception {
        // Create first user
        RegisterRequest firstUser = new RegisterRequest();
        firstUser.setUsername("user1");
        firstUser.setFirstName("User");
        firstUser.setLastName("One");
        firstUser.setEmail("duplicate@example.com");
        firstUser.setPassword("Password123");
        firstUser.setRole("TRAVELER");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(firstUser)))
                .andExpect(status().isCreated());

        // Try to create second user with same email
        RegisterRequest secondUser = new RegisterRequest();
        secondUser.setUsername("user2");
        secondUser.setFirstName("User");
        secondUser.setLastName("Two");
        secondUser.setEmail("duplicate@example.com");
        secondUser.setPassword("Password123");
        secondUser.setRole("GUIDE");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testDifferentUserRoles() throws Exception {
        // Test TRAVELER registration
        RegisterRequest travelerRequest = new RegisterRequest();
        travelerRequest.setUsername("traveler");
        travelerRequest.setFirstName("Traveler");
        travelerRequest.setLastName("User");
        travelerRequest.setEmail("traveler@example.com");
        travelerRequest.setPassword("Password123");
        travelerRequest.setRole("TRAVELER");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(travelerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_TRAVELER"));

        // Test GUIDE registration
        RegisterRequest guideRequest = new RegisterRequest();
        guideRequest.setUsername("guide");
        guideRequest.setFirstName("Guide");
        guideRequest.setLastName("User");
        guideRequest.setEmail("guide@example.com");
        guideRequest.setPassword("Password123");
        guideRequest.setRole("GUIDE");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(guideRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_GUIDE"));

        // Test ADMIN registration
        RegisterRequest adminRequest = new RegisterRequest();
        adminRequest.setUsername("admin");
        adminRequest.setFirstName("Admin");
        adminRequest.setLastName("User");
        adminRequest.setEmail("admin@example.com");
        adminRequest.setPassword("Password123");
        adminRequest.setRole("ADMIN");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"));
    }
}
