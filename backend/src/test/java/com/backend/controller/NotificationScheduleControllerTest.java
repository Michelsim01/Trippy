package com.backend.controller;

import com.backend.service.DailyNotificationService;
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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for NotificationScheduleController.
 * Tests notification scheduling and administrative operations.
 */
@ExtendWith(MockitoExtension.class)
class NotificationScheduleControllerTest {

    @Mock
    private DailyNotificationService dailyNotificationService;

    @InjectMocks
    private NotificationScheduleController notificationScheduleController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationScheduleController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Trigger daily reminders should return success response")
    void testTriggerDailyReminders_Success() throws Exception {
        // Arrange
        doNothing().when(dailyNotificationService).triggerManualReminder();

        // Act & Assert
        mockMvc.perform(post("/api/admin/notifications/trigger-daily-reminders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Daily reminder notifications triggered successfully"));

        verify(dailyNotificationService).triggerManualReminder();
    }

    @Test
    @DisplayName("Trigger daily reminders should handle service exceptions")
    void testTriggerDailyReminders_Exception() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Service error"))
                .when(dailyNotificationService).triggerManualReminder();

        // Act & Assert
        mockMvc.perform(post("/api/admin/notifications/trigger-daily-reminders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Failed to trigger daily reminders: Service error"));

        verify(dailyNotificationService).triggerManualReminder();
    }

    @Test
    @DisplayName("Get schedule info should return schedule information")
    void testGetScheduleInfo_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/admin/notifications/schedule-info")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.scheduleInfo").exists())
                .andExpect(jsonPath("$.scheduleInfo.cronExpression").value("0 0 0 * * * (Daily at midnight Singapore time)"))
                .andExpect(jsonPath("$.scheduleInfo.timezone").value("Asia/Singapore"))
                .andExpect(jsonPath("$.scheduleInfo.description").exists());

        // Verify no service calls are made for this endpoint
        verifyNoInteractions(dailyNotificationService);
    }

    @Test
    @DisplayName("Trigger daily reminders should accept requests without content type")
    void testTriggerDailyReminders_NoContentType() throws Exception {
        // Arrange
        doNothing().when(dailyNotificationService).triggerManualReminder();

        // Act & Assert
        mockMvc.perform(post("/api/admin/notifications/trigger-daily-reminders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Daily reminder notifications triggered successfully"));

        verify(dailyNotificationService).triggerManualReminder();
    }

    @Test
    @DisplayName("Get schedule info should work with GET request")
    void testGetScheduleInfo_GetRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/admin/notifications/schedule-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.scheduleInfo").exists());

        verifyNoInteractions(dailyNotificationService);
    }

    @Test
    @DisplayName("Trigger daily reminders should only accept POST requests")
    void testTriggerDailyReminders_InvalidMethod() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/admin/notifications/trigger-daily-reminders"))
                .andExpect(status().isMethodNotAllowed());

        verify(dailyNotificationService, never()).triggerManualReminder();
    }

    @Test
    @DisplayName("Get schedule info should only accept GET requests")
    void testGetScheduleInfo_InvalidMethod() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/admin/notifications/schedule-info"))
                .andExpect(status().isMethodNotAllowed());

        verifyNoInteractions(dailyNotificationService);
    }

    @Test
    @DisplayName("Trigger daily reminders should handle empty request body")
    void testTriggerDailyReminders_EmptyBody() throws Exception {
        // Arrange
        doNothing().when(dailyNotificationService).triggerManualReminder();

        // Act & Assert
        mockMvc.perform(post("/api/admin/notifications/trigger-daily-reminders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Daily reminder notifications triggered successfully"));

        verify(dailyNotificationService).triggerManualReminder();
    }

    @Test
    @DisplayName("Trigger daily reminders should handle null pointer exceptions")
    void testTriggerDailyReminders_NullPointerException() throws Exception {
        // Arrange
        doThrow(new NullPointerException("Null pointer error"))
                .when(dailyNotificationService).triggerManualReminder();

        // Act & Assert
        mockMvc.perform(post("/api/admin/notifications/trigger-daily-reminders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Failed to trigger daily reminders: Null pointer error"));

        verify(dailyNotificationService).triggerManualReminder();
    }

    @Test
    @DisplayName("Get schedule info should return consistent response structure")
    void testGetScheduleInfo_ResponseStructure() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/admin/notifications/schedule-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").isBoolean())
                .andExpect(jsonPath("$.scheduleInfo").isMap())
                .andExpect(jsonPath("$.scheduleInfo.cronExpression").isString())
                .andExpect(jsonPath("$.scheduleInfo.timezone").isString())
                .andExpect(jsonPath("$.scheduleInfo.description").isString());

        verifyNoInteractions(dailyNotificationService);
    }
}