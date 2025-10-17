package com.backend.controller;

import com.backend.entity.Notification;
import com.backend.entity.NotificationType;
import com.backend.entity.User;
import com.backend.repository.NotificationRepository;
import com.backend.repository.UserRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for NotificationController.
 * Tests notification CRUD operations and user-specific notification management.
 */
@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationController notificationController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Get all notifications should return list of notifications")
    void testGetAllNotifications_Success() throws Exception {
        // Arrange
        List<Notification> notifications = Arrays.asList(
                createTestNotification(1L, "Test notification 1"),
                createTestNotification(2L, "Test notification 2")
        );
        when(notificationRepository.findAll()).thenReturn(notifications);

        // Act & Assert
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(notificationRepository).findAll();
    }

    @Test
    @DisplayName("Get notification by ID should return notification when found")
    void testGetNotificationById_Success() throws Exception {
        // Arrange
        Notification notification = createTestNotification(1L, "Test notification");
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        // Act & Assert
        mockMvc.perform(get("/api/notifications/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationId").value(1))
                .andExpect(jsonPath("$.title").value("Test notification"));

        verify(notificationRepository).findById(1L);
    }

    @Test
    @DisplayName("Get notification by ID should return null when not found")
    void testGetNotificationById_NotFound() throws Exception {
        // Arrange
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/notifications/999"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(notificationRepository).findById(999L);
    }

    @Test
    @DisplayName("Get notifications by user ID should return user notifications")
    void testGetNotificationsByUserId_Success() throws Exception {
        // Arrange
        User user = new User();
        List<Notification> notifications = Arrays.asList(
                createTestNotification(1L, "User notification 1"),
                createTestNotification(2L, "User notification 2")
        );
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.findByUser(user)).thenReturn(notifications);

        // Act & Assert
        mockMvc.perform(get("/api/notifications/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(userRepository).findById(1L);
        verify(notificationRepository).findByUser(user);
    }

    @Test
    @DisplayName("Get notifications by user ID should return not found for invalid user")
    void testGetNotificationsByUserId_UserNotFound() throws Exception {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/notifications/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("User not found with ID: 999"));

        verify(userRepository).findById(999L);
        verify(notificationRepository, never()).findByUser(any(User.class));
    }

    @Test
    @DisplayName("Create notification should return created notification")
    void testCreateNotification_Success() throws Exception {
        // Arrange
        User user = new User();
        Notification savedNotification = createTestNotification(1L, "New notification");
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        Map<String, Object> payload = createNotificationPayload();

        // Act & Assert
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationId").value(1))
                .andExpect(jsonPath("$.title").value("New notification"));

        verify(userRepository).findById(1L);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Create notification should return bad request for missing user ID")
    void testCreateNotification_MissingUserId() throws Exception {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Test notification");
        payload.put("message", "Test message");

        // Act & Assert
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("User ID is required"));

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("Create notification should return bad request for invalid user")
    void testCreateNotification_InvalidUser() throws Exception {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Map<String, Object> payload = createNotificationPayload();
        payload.put("userId", 999);

        // Act & Assert
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("User not found with ID: 999"));

        verify(userRepository).findById(999L);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("Create notification should return bad request for invalid notification type")
    void testCreateNotification_InvalidType() throws Exception {
        // Arrange
        User user = new User();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Map<String, Object> payload = createNotificationPayload();
        payload.put("type", "INVALID_TYPE");

        // Act & Assert
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid notification type: INVALID_TYPE"));

        verify(userRepository).findById(1L);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("Update notification should return updated notification")
    void testUpdateNotification_Success() throws Exception {
        // Arrange
        Notification notification = createTestNotification(1L, "Updated notification");
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // Act & Assert
        mockMvc.perform(put("/api/notifications/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(notification)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationId").value(1))
                .andExpect(jsonPath("$.title").value("Updated notification"));

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Mark notification as read should update notification")
    void testMarkAsRead_Success() throws Exception {
        // Arrange
        Notification notification = createTestNotification(1L, "Test notification");
        notification.setIsRead(false);
        
        Notification updatedNotification = createTestNotification(1L, "Test notification");
        updatedNotification.setIsRead(true);
        
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(updatedNotification);

        // Act & Assert
        mockMvc.perform(patch("/api/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationId").value(1))
                .andExpect(jsonPath("$.isRead").value(true));

        verify(notificationRepository).findById(1L);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Mark notification as read should return not found for invalid ID")
    void testMarkAsRead_NotFound() throws Exception {
        // Arrange
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(patch("/api/notifications/999/read"))
                .andExpect(status().isNotFound());

        verify(notificationRepository).findById(999L);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("Delete notification should remove notification")
    void testDeleteNotification_Success() throws Exception {
        // Arrange
        doNothing().when(notificationRepository).deleteById(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/notifications/1"))
                .andExpect(status().isOk());

        verify(notificationRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Create notification should handle service exceptions")
    void testCreateNotification_Exception() throws Exception {
        // Arrange
        User user = new User();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class)))
                .thenThrow(new RuntimeException("Database error"));

        Map<String, Object> payload = createNotificationPayload();

        // Act & Assert
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Error creating notification: Database error"));

        verify(userRepository).findById(1L);
        verify(notificationRepository).save(any(Notification.class));
    }

    /**
     * Helper method to create test Notification objects
     */
    private Notification createTestNotification(Long id, String title) {
        Notification notification = new Notification();
        notification.setNotificationId(id);
        notification.setTitle(title);
        notification.setMessage("Test message for " + title);
        notification.setType(NotificationType.BOOKING_CONFIRMATION);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setSentAt(LocalDateTime.now());
        return notification;
    }

    /**
     * Helper method to create notification payload for testing
     */
    private Map<String, Object> createNotificationPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "New notification");
        payload.put("message", "Test message");
        payload.put("userId", 1);
        payload.put("type", "BOOKING_CONFIRMATION");
        return payload;
    }
}