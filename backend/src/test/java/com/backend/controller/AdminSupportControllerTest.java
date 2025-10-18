package com.backend.controller;

import com.backend.entity.*;
import com.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for AdminSupportController.
 * Tests controller logic in isolation with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class AdminSupportControllerTest {

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private UserDetails userDetails;

    @InjectMocks
    private AdminSupportController adminSupportController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminSupportController).build();
        objectMapper = new ObjectMapper();
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testGetTicketMetrics_Success() throws Exception {
        // Arrange
        when(supportTicketRepository.count()).thenReturn(100L);
        when(supportTicketRepository.countByStatus(SupportTicketStatus.OPEN)).thenReturn(25L);
        when(supportTicketRepository.countByStatus(SupportTicketStatus.IN_PROGRESS)).thenReturn(30L);
        when(supportTicketRepository.countByStatus(SupportTicketStatus.RESOLVED)).thenReturn(35L);
        when(supportTicketRepository.countByStatus(SupportTicketStatus.CLOSED)).thenReturn(10L);

        // Act & Assert
        mockMvc.perform(get("/api/admin/tickets/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTickets").value(100))
                .andExpect(jsonPath("$.openTickets").value(25))
                .andExpect(jsonPath("$.inProgressTickets").value(30))
                .andExpect(jsonPath("$.resolvedTickets").value(35))
                .andExpect(jsonPath("$.closedTickets").value(10));

        verify(supportTicketRepository).count();
        verify(supportTicketRepository).countByStatus(SupportTicketStatus.OPEN);
        verify(supportTicketRepository).countByStatus(SupportTicketStatus.IN_PROGRESS);
        verify(supportTicketRepository).countByStatus(SupportTicketStatus.RESOLVED);
        verify(supportTicketRepository).countByStatus(SupportTicketStatus.CLOSED);
    }

    @Test
    void testTestEndpoint_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/admin/tickets/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("AdminSupportController is working"));
    }

    @Test
    void testGetAllTickets_Success() throws Exception {
        // Arrange
        List<SupportTicket> tickets = Arrays.asList(
                createTestSupportTicket(1L, SupportTicketStatus.OPEN),
                createTestSupportTicket(2L, SupportTicketStatus.IN_PROGRESS)
        );
        when(supportTicketRepository.findAll()).thenReturn(tickets);

        // Act & Assert
        mockMvc.perform(get("/api/admin/tickets"))
                .andExpect(status().isOk());

        verify(supportTicketRepository).findAll();
    }

    @Test
    void testGetMyTickets_Success() throws Exception {
        // Arrange
        User adminUser = createTestAdminUser();
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("admin@example.com");
        when(userRepository.findByEmailAndIsActive("admin@example.com", true))
                .thenReturn(Optional.of(adminUser));

        List<SupportTicket> tickets = Arrays.asList(
                createTestSupportTicket(1L, SupportTicketStatus.IN_PROGRESS)
        );
        when(supportTicketRepository.findByAssignedToOrderByCreatedAtDesc(1L)).thenReturn(tickets);

        // Act & Assert
        mockMvc.perform(get("/api/admin/tickets/my-tickets"))
                .andExpect(status().isOk());

        verify(userRepository).findByEmailAndIsActive("admin@example.com", true);
        verify(supportTicketRepository).findByAssignedToOrderByCreatedAtDesc(1L);
    }

    @Test
    void testGetMyTickets_UnAuthenticated() throws Exception {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("admin@example.com");
        when(userRepository.findByEmailAndIsActive("admin@example.com", true))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/admin/tickets/my-tickets"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Admin not authenticated"));

        verify(userRepository).findByEmailAndIsActive("admin@example.com", true);
        verify(supportTicketRepository, never()).findByAssignedToOrderByCreatedAtDesc(anyLong());
    }

    @Test
    void testTakeTicket_Success() throws Exception {
        // Arrange
        User adminUser = createTestAdminUser();
        SupportTicket ticket = createTestSupportTicket(1L, SupportTicketStatus.OPEN);
        ticket.setAssignedTo(null); // Unassigned ticket

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("admin@example.com");
        when(userRepository.findByEmailAndIsActive("admin@example.com", true))
                .thenReturn(Optional.of(adminUser));
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(supportTicketRepository.save(any(SupportTicket.class))).thenReturn(ticket);

        // Act & Assert
        mockMvc.perform(put("/api/admin/tickets/1/take"))
                .andExpect(status().isOk());

        verify(supportTicketRepository).findById(1L);
        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void testTakeTicket_AlreadyAssigned() throws Exception {
        // Arrange
        User adminUser = createTestAdminUser();
        SupportTicket ticket = createTestSupportTicket(1L, SupportTicketStatus.IN_PROGRESS);
        ticket.setAssignedTo(2L); // Already assigned to another admin

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("admin@example.com");
        when(userRepository.findByEmailAndIsActive("admin@example.com", true))
                .thenReturn(Optional.of(adminUser));
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        // Act & Assert
        mockMvc.perform(put("/api/admin/tickets/1/take"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Ticket is already assigned to another admin"));

        verify(supportTicketRepository).findById(1L);
        verify(supportTicketRepository, never()).save(any(SupportTicket.class));
    }

    @Test
    void testTakeTicket_NotOpen() throws Exception {
        // Arrange
        User adminUser = createTestAdminUser();
        SupportTicket ticket = createTestSupportTicket(1L, SupportTicketStatus.RESOLVED);
        ticket.setAssignedTo(null);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("admin@example.com");
        when(userRepository.findByEmailAndIsActive("admin@example.com", true))
                .thenReturn(Optional.of(adminUser));
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        // Act & Assert
        mockMvc.perform(put("/api/admin/tickets/1/take"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only OPEN tickets can be taken"));

        verify(supportTicketRepository).findById(1L);
        verify(supportTicketRepository, never()).save(any(SupportTicket.class));
    }

    @Test
    void testUpdateTicketStatus_Success() throws Exception {
        // Arrange
        SupportTicket ticket = createTestSupportTicket(1L, SupportTicketStatus.IN_PROGRESS);
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "RESOLVED");

        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(supportTicketRepository.save(any(SupportTicket.class))).thenReturn(ticket);

        // Act & Assert
        mockMvc.perform(put("/api/admin/tickets/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isOk());

        verify(supportTicketRepository).findById(1L);
        verify(supportTicketRepository).save(any(SupportTicket.class));
    }

    @Test
    void testUpdateTicketStatus_InvalidStatus() throws Exception {
        // Arrange
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "INVALID_STATUS");

        // Act & Assert
        mockMvc.perform(put("/api/admin/tickets/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status: INVALID_STATUS"));

        verify(supportTicketRepository, never()).findById(anyLong());
        verify(supportTicketRepository, never()).save(any(SupportTicket.class));
    }

    @Test
    void testDeleteTicket_Success() throws Exception {
        // Arrange
        SupportTicket ticket = createTestSupportTicket(1L, SupportTicketStatus.CLOSED);
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        // Act & Assert
        mockMvc.perform(delete("/api/admin/tickets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ticket deleted successfully"));

        verify(supportTicketRepository).findById(1L);
        verify(supportTicketRepository).deleteById(1L);
    }

    @Test
    void testDeleteTicket_NotFound() throws Exception {
        // Arrange
        when(supportTicketRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(delete("/api/admin/tickets/999"))
                .andExpect(status().isNotFound());

        verify(supportTicketRepository).findById(999L);
        verify(supportTicketRepository, never()).deleteById(anyLong());
    }

    // Helper methods for creating test objects
    private User createTestAdminUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("admin@example.com");
        user.setFirstName("Admin");
        user.setLastName("User");
        user.setIsActive(true);
        user.setIsAdmin(true);
        return user;
    }

    private SupportTicket createTestSupportTicket(Long id, SupportTicketStatus status) {
        SupportTicket ticket = new SupportTicket();
        ticket.setId(id);
        ticket.setStatus(status);
        ticket.setTicketType(TicketType.GENERAL_INQUIRY);
        ticket.setUserName("Test User");
        ticket.setUserEmail("test@example.com");
        ticket.setDescription("Test Description");
        ticket.setCreatedAt(LocalDateTime.now());
        return ticket;
    }
}