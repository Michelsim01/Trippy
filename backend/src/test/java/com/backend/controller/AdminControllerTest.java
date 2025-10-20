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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for AdminController.
 * Tests admin-specific operations including user management, experience management,
 * booking management, KYC processing, and dashboard metrics.
 */
@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private KycDocumentRepository kycDocumentRepository;

    @Mock
    private TransactionRepository transactionRepository;



    @InjectMocks
    private AdminController adminController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testGetDashboardMetrics_Success() throws Exception {
        // Arrange
        // Mock revenue calculations
        when(bookingRepository.calculateRevenueByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(BigDecimal.valueOf(1000.0))
                .thenReturn(BigDecimal.valueOf(800.0)); // thisMonth, lastMonth
        
        // Mock basic counts
        when(userRepository.countByIsAdmin(false)).thenReturn(100L);
        when(bookingRepository.count()).thenReturn(200L);
        when(experienceRepository.countByStatus(any())).thenReturn(50L);
        
        // Mock month-over-month counts
        when(userRepository.countByCreatedAtBetweenAndIsAdmin(any(LocalDateTime.class), any(LocalDateTime.class), eq(false)))
                .thenReturn(15L) // thisMonth users
                .thenReturn(10L); // lastMonth users
        when(bookingRepository.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(25L) // thisMonth bookings
                .thenReturn(20L); // lastMonth bookings

        // Act & Assert
        mockMvc.perform(get("/api/admin/dashboard/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyRevenue").exists())
                .andExpect(jsonPath("$.totalUsers").exists())
                .andExpect(jsonPath("$.totalBookings").exists())
                .andExpect(jsonPath("$.activeExperiences").exists());

        // Verify all the repository calls
        verify(bookingRepository, times(2)).calculateRevenueByDateRange(any(LocalDateTime.class), any(LocalDateTime.class));
        verify(userRepository).countByIsAdmin(false);
        verify(bookingRepository).count();
        verify(experienceRepository).countByStatus(any());
        verify(userRepository, times(2)).countByCreatedAtBetweenAndIsAdmin(any(LocalDateTime.class), any(LocalDateTime.class), eq(false));
        verify(bookingRepository, times(2)).countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    void testGetAllUsers_Success() throws Exception {
        // Arrange
        List<User> users = Arrays.asList(
                createTestUser(1L, "user1@example.com", "John", "Doe"),
                createTestUser(2L, "user2@example.com", "Jane", "Smith")
        );
        when(userRepository.findAll()).thenReturn(users);

        // Act & Assert
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk());

        verify(userRepository).findAll();
    }

    @Test
    void testUpdateUser_Success() throws Exception {
        // Arrange
        User existingUser = createTestUser(1L, "user@example.com", "John", "Doe");
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("firstName", "Updated");
        updateData.put("lastName", "Name");
        updateData.put("email", "updated@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act & Assert
        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk());

        verify(userRepository).findById(1L);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateUser_UserNotFound() throws Exception {
        // Arrange
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("firstName", "Updated");

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(put("/api/admin/users/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isNotFound());

        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testSuspendUser_Success() throws Exception {
        // Arrange
        User user = createTestUser(1L, "user@example.com", "John", "Doe");
        user.setIsActive(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Act & Assert
        mockMvc.perform(put("/api/admin/users/1/suspend"))
                .andExpect(status().isOk());

        verify(userRepository).findById(1L);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRejectKYC_Success() throws Exception {
        // Arrange
        User testUser = createTestUser(2L, "user@example.com", "John", "Doe");
        KycDocument kycDocument = createTestKycDocument(1L, StatusType.PENDING);
        kycDocument.setUser(testUser); // Set the user relationship
        
        Map<String, String> rejectRequest = new HashMap<>();
        rejectRequest.put("declineMessage", "Invalid document");

        when(kycDocumentRepository.findById(1L)).thenReturn(Optional.of(kycDocument));
        when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(kycDocument);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(put("/api/admin/kyc/submissions/1/decline")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(kycDocumentRepository).findById(1L);
        verify(kycDocumentRepository).save(any(KycDocument.class));
        verify(userRepository).save(any(User.class));
    }

    // Helper methods for creating test objects
    private User createTestUser(Long id, String email, String firstName, String lastName) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setIsActive(true);
        user.setCanCreateExperiences(false);
        user.setIsAdmin(false);
        return user;
    }

    private KycDocument createTestKycDocument(Long id, StatusType status) {
        KycDocument kycDocument = new KycDocument();
        kycDocument.setStatus(status);
        kycDocument.setCreatedAt(LocalDateTime.now());
        return kycDocument;
    }
}