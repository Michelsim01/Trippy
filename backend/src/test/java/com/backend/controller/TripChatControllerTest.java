package com.backend.controller;

import com.backend.entity.PersonalChat;
import com.backend.service.TripChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TripChatControllerTest {

    @Mock
    private TripChatService tripChatService;

    @InjectMocks
    private TripChatController tripChatController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tripChatController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getUserTripChats_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        PersonalChat chat1 = createTestPersonalChat(1L);
        PersonalChat chat2 = createTestPersonalChat(2L);
        List<PersonalChat> chats = Arrays.asList(chat1, chat2);

        when(tripChatService.getUserTripChats(userId)).thenReturn(chats);

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_InvalidUserId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", -1L))
                .andExpect(status().isBadRequest());

        verify(tripChatService, never()).getUserTripChats(any());
    }

    @Test
    void getUserTripChats_Exception() throws Exception {
        // Arrange
        Long userId = 1L;
        when(tripChatService.getUserTripChats(userId)).thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isInternalServerError());

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_EmptyResult() throws Exception {
        // Arrange
        Long userId = 1L;
        when(tripChatService.getUserTripChats(userId)).thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_NullUserId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", "null"))
                .andExpect(status().isBadRequest());

        verify(tripChatService, never()).getUserTripChats(any());
    }

    @Test
    void getUserTripChats_ServiceUnavailable() throws Exception {
        // Arrange
        Long userId = 1L;
        when(tripChatService.getUserTripChats(userId)).thenThrow(new IllegalStateException("Service unavailable"));

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isInternalServerError());

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_ZeroUserId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", 0L))
                .andExpect(status().isBadRequest());

        verify(tripChatService, never()).getUserTripChats(any());
    }

    @Test
    void getUserTripChats_ServiceReturnsNull() throws Exception {
        // Arrange
        Long userId = 1L;
        when(tripChatService.getUserTripChats(userId)).thenReturn(null);

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").doesNotExist());

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_LargeUserId() throws Exception {
        // Arrange
        Long userId = Long.MAX_VALUE;
        when(tripChatService.getUserTripChats(userId)).thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_ServiceTimeout() throws Exception {
        // Arrange
        Long userId = 1L;
        when(tripChatService.getUserTripChats(userId)).thenThrow(new RuntimeException("Timeout"));

        // Act & Assert
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId))
                .andExpect(status().isInternalServerError());

        verify(tripChatService).getUserTripChats(userId);
    }

    @Test
    void getUserTripChats_MultipleValidUsers() throws Exception {
        // Arrange
        Long userId1 = 1L;
        Long userId2 = 2L;
        PersonalChat chat1 = createTestPersonalChat(1L);
        PersonalChat chat2 = createTestPersonalChat(2L);

        when(tripChatService.getUserTripChats(userId1)).thenReturn(Arrays.asList(chat1));
        when(tripChatService.getUserTripChats(userId2)).thenReturn(Arrays.asList(chat2));

        // Act & Assert for first user
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // Act & Assert for second user
        mockMvc.perform(get("/api/trip-chats/user/{userId}", userId2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(tripChatService).getUserTripChats(userId1);
        verify(tripChatService).getUserTripChats(userId2);
    }

    // Helper methods
    private PersonalChat createTestPersonalChat(Long id) {
        PersonalChat chat = new PersonalChat();
        chat.setPersonalChatId(id);
        chat.setName("Test Chat");
        chat.setIsTripChat(true);
        chat.setCreatedAt(LocalDateTime.now());
        return chat;
    }
}