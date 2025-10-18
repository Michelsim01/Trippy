package com.backend.controller;

import com.backend.entity.SupportTicket;
import com.backend.entity.SupportTicketStatus;
import com.backend.entity.TicketType;
import com.backend.entity.User;
import com.backend.repository.SupportTicketRepository;
import com.backend.repository.UserRepository;
import com.backend.util.JwtUtil;
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

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SupportControllerTest {

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private SupportController supportController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(supportController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void createTicket_AuthenticatedUser_Success() throws Exception {
        // Arrange
        String token = "valid-jwt-token";
        String authenticatedEmail = "authenticated@example.com";
        User authenticatedUser = createTestUser(1L, authenticatedEmail);
        SupportTicket savedTicket = createTestSupportTicket(1L);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userEmail", "form@example.com");
        requestBody.put("userName", "Form User");
        requestBody.put("description", "Test issue description");
        requestBody.put("ticketType", "GENERAL_INQUIRY");

        when(jwtUtil.validateToken(token)).thenReturn(true);
        when(jwtUtil.extractUsername(token)).thenReturn(authenticatedEmail);
        when(userRepository.findByEmail(authenticatedEmail)).thenReturn(Optional.of(authenticatedUser));
        when(supportTicketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        // Act & Assert
        mockMvc.perform(post("/api/support/tickets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ticket created"))
                .andExpect(jsonPath("$.ticketId").value(1L));

        verify(jwtUtil).validateToken(token);
        verify(jwtUtil).extractUsername(token);
        verify(userRepository).findByEmail(authenticatedEmail);
        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void createTicket_NoAuthentication_Success() throws Exception {
        // Arrange
        String formEmail = "form@example.com";
        User formUser = createTestUser(1L, formEmail);
        SupportTicket savedTicket = createTestSupportTicket(1L);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userEmail", formEmail);
        requestBody.put("userName", "Form User");
        requestBody.put("description", "Test issue description");
        requestBody.put("ticketType", "GENERAL_INQUIRY");

        when(userRepository.findByEmail(formEmail)).thenReturn(Optional.of(formUser));
        when(supportTicketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        // Act & Assert
        mockMvc.perform(post("/api/support/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ticket created"))
                .andExpect(jsonPath("$.ticketId").value(1L));

        verify(userRepository).findByEmail(formEmail);
        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void createTicket_InvalidToken_UsesFormData() throws Exception {
        // Arrange
        String invalidToken = "invalid-jwt-token";
        String formEmail = "form@example.com";
        SupportTicket savedTicket = createTestSupportTicket(1L);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userEmail", formEmail);
        requestBody.put("userName", "Form User");
        requestBody.put("description", "Test issue description");
        requestBody.put("ticketType", "GENERAL_INQUIRY");

        when(jwtUtil.validateToken(invalidToken)).thenReturn(false);
        when(userRepository.findByEmail(formEmail)).thenReturn(Optional.empty());
        when(supportTicketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        // Act & Assert
        mockMvc.perform(post("/api/support/tickets")
                .header("Authorization", "Bearer " + invalidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ticket created"))
                .andExpect(jsonPath("$.ticketId").value(1L));

        verify(jwtUtil).validateToken(invalidToken);
        verify(userRepository).findByEmail(formEmail);
        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void createTicket_MissingRequiredFields() throws Exception {
        // Arrange
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userEmail", "");
        requestBody.put("userName", "");
        requestBody.put("description", "");

        // Act & Assert
        mockMvc.perform(post("/api/support/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("userName, userEmail and description are required"));

        verify(supportTicketRepository, never()).save(any());
    }

    @Test
    void createTicket_JwtTokenException() throws Exception {
        // Arrange
        String token = "problematic-jwt-token";
        String formEmail = "form@example.com";
        SupportTicket savedTicket = createTestSupportTicket(1L);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userEmail", formEmail);
        requestBody.put("userName", "Form User");
        requestBody.put("description", "Test issue description");
        requestBody.put("ticketType", "GENERAL_INQUIRY");

        when(jwtUtil.validateToken(token)).thenThrow(new RuntimeException("JWT parsing error"));
        when(userRepository.findByEmail(formEmail)).thenReturn(Optional.empty());
        when(supportTicketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        // Act & Assert
        mockMvc.perform(post("/api/support/tickets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ticket created"));

        verify(jwtUtil).validateToken(token);
        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void createTicket_RepositoryException() throws Exception {
        // Arrange
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userEmail", "test@example.com");
        requestBody.put("userName", "Test User");
        requestBody.put("description", "Test issue description");
        requestBody.put("ticketType", "GENERAL_INQUIRY");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(supportTicketRepository.save(any(SupportTicket.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(post("/api/support/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Database error"));

        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void checkSuspension_UserExists_Active() throws Exception {
        // Arrange
        String email = "active@example.com";
        User activeUser = createTestUser(1L, email);
        activeUser.setIsActive(true);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(activeUser));

        // Act & Assert
        mockMvc.perform(get("/api/support/suspension-status")
                .param("email", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.userId").value(1L));

        verify(userRepository).findByEmail(email);
    }

    @Test
    void checkSuspension_UserExists_Suspended() throws Exception {
        // Arrange
        String email = "suspended@example.com";
        User suspendedUser = createTestUser(2L, email);
        suspendedUser.setIsActive(false);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(suspendedUser));

        // Act & Assert
        mockMvc.perform(get("/api/support/suspension-status")
                .param("email", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true))
                .andExpect(jsonPath("$.isActive").value(false))
                .andExpect(jsonPath("$.userId").value(2L));

        verify(userRepository).findByEmail(email);
    }

    @Test
    void checkSuspension_UserNotExists() throws Exception {
        // Arrange
        String email = "nonexistent@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/support/suspension-status")
                .param("email", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(false))
                .andExpect(jsonPath("$.isActive").value(true));

        verify(userRepository).findByEmail(email);
    }

    @Test
    void checkSuspension_UserActiveIsNull() throws Exception {
        // Arrange
        String email = "nullactive@example.com";
        User user = createTestUser(3L, email);
        user.setIsActive(null);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // Act & Assert
        mockMvc.perform(get("/api/support/suspension-status")
                .param("email", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.userId").value(3L));

        verify(userRepository).findByEmail(email);
    }

    // Helper methods
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setIsActive(true);
        return user;
    }

    private SupportTicket createTestSupportTicket(Long id) {
        SupportTicket ticket = new SupportTicket();
        ticket.setId(id);
        ticket.setUserEmail("test@example.com");
        ticket.setUserName("Test User");
        ticket.setDescription("Test description");
        ticket.setTicketType(TicketType.GENERAL_INQUIRY);
        ticket.setStatus(SupportTicketStatus.OPEN);
        return ticket;
    }
}