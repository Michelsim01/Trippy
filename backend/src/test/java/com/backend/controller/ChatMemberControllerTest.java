package com.backend.controller;

import com.backend.entity.ChatMember;
import com.backend.entity.ChatRoleEnum;
import com.backend.entity.User;
import com.backend.repository.ChatMemberRepository;
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

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for ChatMemberController.
 * Tests controller logic in isolation with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class ChatMemberControllerTest {

    @Mock
    private ChatMemberRepository chatMemberRepository;

    @InjectMocks
    private ChatMemberController chatMemberController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(chatMemberController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testGetAllChatMembers_Success() throws Exception {
        // Arrange
        List<ChatMember> chatMembers = Arrays.asList(
                createTestChatMember(1L),
                createTestChatMember(2L)
        );
        when(chatMemberRepository.findAll()).thenReturn(chatMembers);

        // Act & Assert
        mockMvc.perform(get("/api/chat-members"))
                .andExpect(status().isOk());

        verify(chatMemberRepository).findAll();
    }

    @Test
    void testGetChatMemberById_Success() throws Exception {
        // Arrange
        ChatMember chatMember = createTestChatMember(1L);
        when(chatMemberRepository.findById(1L)).thenReturn(Optional.of(chatMember));

        // Act & Assert
        mockMvc.perform(get("/api/chat-members/1"))
                .andExpect(status().isOk());

        verify(chatMemberRepository).findById(1L);
    }

    @Test
    void testGetChatMemberById_NotFound() throws Exception {
        // Arrange
        when(chatMemberRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/chat-members/999"))
                .andExpect(status().isNotFound());

        verify(chatMemberRepository).findById(999L);
    }

    @Test
    void testGetChatMemberById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/chat-members/0"))
                .andExpect(status().isBadRequest());

        verify(chatMemberRepository, never()).findById(anyLong());
    }

    @Test
    void testCreateChatMember_Success() throws Exception {
        // Arrange
        ChatMember chatMember = createTestChatMemberWithoutTimestamps(1L);
        when(chatMemberRepository.save(any(ChatMember.class))).thenReturn(chatMember);

        // Act & Assert
        mockMvc.perform(post("/api/chat-members")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chatMember)))
                .andExpect(status().isCreated());

        verify(chatMemberRepository).save(any(ChatMember.class));
    }

    @Test
    void testCreateChatMember_NullInput() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/chat-members")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(chatMemberRepository, never()).save(any(ChatMember.class));
    }

    @Test
    void testUpdateChatMember_Success() throws Exception {
        // Arrange
        ChatMember chatMember = createTestChatMemberWithoutTimestamps(1L);
        when(chatMemberRepository.existsById(1L)).thenReturn(true);
        when(chatMemberRepository.save(any(ChatMember.class))).thenReturn(chatMember);

        // Act & Assert
        mockMvc.perform(put("/api/chat-members/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chatMember)))
                .andExpect(status().isOk());

        verify(chatMemberRepository).existsById(1L);
        verify(chatMemberRepository).save(any(ChatMember.class));
    }

    @Test
    void testUpdateChatMember_NotFound() throws Exception {
        // Arrange
        ChatMember chatMember = createTestChatMemberWithoutTimestamps(999L);
        when(chatMemberRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(put("/api/chat-members/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chatMember)))
                .andExpect(status().isNotFound());

        verify(chatMemberRepository).existsById(999L);
        verify(chatMemberRepository, never()).save(any(ChatMember.class));
    }

    @Test
    void testDeleteChatMember_Success() throws Exception {
        // Arrange
        when(chatMemberRepository.existsById(1L)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/chat-members/1"))
                .andExpect(status().isNoContent());

        verify(chatMemberRepository).existsById(1L);
        verify(chatMemberRepository).deleteById(1L);
    }

    @Test
    void testDeleteChatMember_NotFound() throws Exception {
        // Arrange
        when(chatMemberRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/chat-members/999"))
                .andExpect(status().isNotFound());

        verify(chatMemberRepository).existsById(999L);
        verify(chatMemberRepository, never()).deleteById(anyLong());
    }

    @Test
    void testDeleteChatMember_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/chat-members/0"))
                .andExpect(status().isBadRequest());

        verify(chatMemberRepository, never()).existsById(anyLong());
        verify(chatMemberRepository, never()).deleteById(anyLong());
    }

    // Helper methods for creating test objects
    private ChatMember createTestChatMember(Long id) {
        ChatMember chatMember = new ChatMember();
        chatMember.setId(id);
        chatMember.setRole(ChatRoleEnum.MEMBER);
        chatMember.setCreatedAt(LocalDateTime.now());
        
        // Create a test user
        User user = new User();
        user.setId(id);
        user.setEmail("user" + id + "@example.com");
        user.setFirstName("User");
        user.setLastName(String.valueOf(id));
        chatMember.setUser(user);
        
        return chatMember;
    }

    private ChatMember createTestChatMemberWithoutTimestamps(Long id) {
        ChatMember chatMember = new ChatMember();
        chatMember.setId(id);
        chatMember.setRole(ChatRoleEnum.MEMBER);
        
        // Create a test user
        User user = new User();
        user.setId(id);
        user.setEmail("user" + id + "@example.com");
        user.setFirstName("User");
        user.setLastName(String.valueOf(id));
        chatMember.setUser(user);
        
        return chatMember;
    }
}