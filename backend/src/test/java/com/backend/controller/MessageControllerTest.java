package com.backend.controller;

import com.backend.entity.Message;
import com.backend.entity.MessageTypeEnum;
import com.backend.entity.PersonalChat;
import com.backend.entity.User;
import com.backend.repository.MessageRepository;
import com.backend.repository.PersonalChatRepository;
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
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for MessageController.
 * Tests message CRUD operations and chat-specific messaging functionality.
 */
@ExtendWith(MockitoExtension.class)
class MessageControllerTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private PersonalChatRepository personalChatRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MessageController messageController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(messageController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Get all messages should return list of messages")
    void testGetAllMessages_Success() throws Exception {
        // Arrange
        List<Message> messages = Arrays.asList(
                createTestMessage(1L, "Hello"),
                createTestMessage(2L, "How are you?")
        );
        when(messageRepository.findAll()).thenReturn(messages);

        // Act & Assert
        mockMvc.perform(get("/api/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(messageRepository).findAll();
    }

    @Test
    @DisplayName("Get all messages should handle repository exception")
    void testGetAllMessages_Exception() throws Exception {
        // Arrange
        when(messageRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/messages"))
                .andExpect(status().isInternalServerError());

        verify(messageRepository).findAll();
    }

    @Test
    @DisplayName("Get message by ID should return message when found")
    void testGetMessageById_Success() throws Exception {
        // Arrange
        Message message = createTestMessage(1L, "Test message");
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        // Act & Assert
        mockMvc.perform(get("/api/messages/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageId").value(1))
                .andExpect(jsonPath("$.content").value("Test message"));

        verify(messageRepository).findById(1L);
    }

    @Test
    @DisplayName("Get message by ID should return not found when message doesn't exist")
    void testGetMessageById_NotFound() throws Exception {
        // Arrange
        when(messageRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/messages/999"))
                .andExpect(status().isNotFound());

        verify(messageRepository).findById(999L);
    }

    @Test
    @DisplayName("Get message by ID should return bad request for invalid ID")
    void testGetMessageById_BadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/messages/0"))
                .andExpect(status().isBadRequest());

        verify(messageRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Create message should return created message")
    void testCreateMessage_Success() throws Exception {
        // Arrange
        Message message = createTestMessage(null, "New message");
        Message savedMessage = createTestMessage(1L, "New message");
        
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        // Act & Assert
        mockMvc.perform(post("/api/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(message)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").value(1))
                .andExpect(jsonPath("$.content").value("New message"));

        verify(messageRepository).save(any(Message.class));
    }

    @Test
    @DisplayName("Create message should return bad request for null message")
    void testCreateMessage_NullMessage() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("null"))
                .andExpect(status().isBadRequest());

        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("Update message should return updated message")
    void testUpdateMessage_Success() throws Exception {
        // Arrange
        Message message = createTestMessage(1L, "Updated message");
        when(messageRepository.existsById(1L)).thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        // Act & Assert
        mockMvc.perform(put("/api/messages/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(message)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageId").value(1))
                .andExpect(jsonPath("$.content").value("Updated message"));

        verify(messageRepository).existsById(1L);
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    @DisplayName("Update message should return not found when message doesn't exist")
    void testUpdateMessage_NotFound() throws Exception {
        // Arrange
        Message message = createTestMessage(999L, "Updated message");
        when(messageRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(put("/api/messages/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(message)))
                .andExpect(status().isNotFound());

        verify(messageRepository).existsById(999L);
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("Delete message should return no content when successful")
    void testDeleteMessage_Success() throws Exception {
        // Arrange
        when(messageRepository.existsById(1L)).thenReturn(true);
        doNothing().when(messageRepository).deleteById(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/messages/1"))
                .andExpect(status().isNoContent());

        verify(messageRepository).existsById(1L);
        verify(messageRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Delete message should return not found when message doesn't exist")
    void testDeleteMessage_NotFound() throws Exception {
        // Arrange
        when(messageRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/messages/999"))
                .andExpect(status().isNotFound());

        verify(messageRepository).existsById(999L);
        verify(messageRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Get messages by chat ID should return messages for chat")
    void testGetMessagesByChatId_Success() throws Exception {
        // Arrange
        List<Message> messages = Arrays.asList(
                createTestMessage(1L, "First message"),
                createTestMessage(2L, "Second message")
        );
        when(messageRepository.findByPersonalChatIdOrderByCreatedAt(1L)).thenReturn(messages);

        // Act & Assert
        mockMvc.perform(get("/api/messages/chat/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].content").value("First message"))
                .andExpect(jsonPath("$[1].content").value("Second message"));

        verify(messageRepository).findByPersonalChatIdOrderByCreatedAt(1L);
    }

    @Test
    @DisplayName("Send message should create and return new message")
    void testSendMessage_Success() throws Exception {
        // Arrange
        PersonalChat personalChat = new PersonalChat();
        // Set only available fields or use mock behavior
        
        User sender = new User();
        // Set only available fields or use mock behavior
        
        Message savedMessage = createTestMessage(1L, "Hello from chat");
        
        when(personalChatRepository.findById(1L)).thenReturn(Optional.of(personalChat));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        MessageController.MessageRequest request = new MessageController.MessageRequest();
        request.setContent("Hello from chat");

        // Act & Assert
        mockMvc.perform(post("/api/messages/chat/1/send")
                        .param("senderId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").value(1))
                .andExpect(jsonPath("$.content").value("Hello from chat"));

        verify(personalChatRepository).findById(1L);
        verify(userRepository).findById(1L);
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    @DisplayName("Send message should return bad request for invalid chat ID")
    void testSendMessage_InvalidChatId() throws Exception {
        // Arrange
        when(personalChatRepository.findById(999L)).thenReturn(Optional.empty());

        MessageController.MessageRequest request = new MessageController.MessageRequest();
        request.setContent("Hello");

        // Act & Assert
        mockMvc.perform(post("/api/messages/chat/999/send")
                        .param("senderId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(personalChatRepository).findById(999L);
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("Send message should return bad request for empty content")
    void testSendMessage_EmptyContent() throws Exception {
        // Arrange
        MessageController.MessageRequest request = new MessageController.MessageRequest();
        request.setContent("");

        // Act & Assert
        mockMvc.perform(post("/api/messages/chat/1/send")
                        .param("senderId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(messageRepository, never()).save(any(Message.class));
    }

    /**
     * Helper method to create test Message objects
     */
    private Message createTestMessage(Long id, String content) {
        Message message = new Message();
        message.setMessageId(id);
        message.setContent(content);
        message.setMessageType(MessageTypeEnum.TEXT);
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(LocalDateTime.now());
        return message;
    }
}