package com.backend.controller;

import com.backend.entity.*;
import com.backend.repository.*;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PersonalChatControllerTest {

    @Mock
    private PersonalChatRepository personalChatRepository;
    
    @Mock
    private ChatMemberRepository chatMemberRepository;
    
    @Mock
    private ExperienceRepository experienceRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private ChatUnreadCountRepository chatUnreadCountRepository;

    @InjectMocks
    private PersonalChatController personalChatController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(personalChatController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getAllPersonalChats_Success() throws Exception {
        // Arrange
        PersonalChat chat1 = createTestPersonalChat(1L);
        PersonalChat chat2 = createTestPersonalChat(2L);
        List<PersonalChat> chats = Arrays.asList(chat1, chat2);

        when(personalChatRepository.findAll()).thenReturn(chats);

        // Act & Assert
        mockMvc.perform(get("/api/personal-chats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(personalChatRepository).findAll();
    }

    @Test
    void getAllPersonalChats_Exception() throws Exception {
        // Arrange
        when(personalChatRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/personal-chats"))
                .andExpect(status().isInternalServerError());

        verify(personalChatRepository).findAll();
    }

    @Test
    void getPersonalChatById_Success() throws Exception {
        // Arrange
        Long chatId = 1L;
        PersonalChat chat = createTestPersonalChat(chatId);
        when(personalChatRepository.findById(chatId)).thenReturn(Optional.of(chat));

        // Act & Assert
        mockMvc.perform(get("/api/personal-chats/{id}", chatId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalChatId").value(chatId));

        verify(personalChatRepository).findById(chatId);
    }

    @Test
    void getPersonalChatById_NotFound() throws Exception {
        // Arrange
        Long chatId = 999L;
        when(personalChatRepository.findById(chatId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/personal-chats/{id}", chatId))
                .andExpect(status().isNotFound());

        verify(personalChatRepository).findById(chatId);
    }

    @Test
    void getPersonalChatById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/personal-chats/{id}", -1L))
                .andExpect(status().isBadRequest());

        verify(personalChatRepository, never()).findById(any());
    }

    @Test
    void createPersonalChat_Success() throws Exception {
        // Arrange
        PersonalChat chat = createTestPersonalChat(null);
        PersonalChat savedChat = createTestPersonalChat(1L);

        when(personalChatRepository.save(any(PersonalChat.class))).thenReturn(savedChat);

        // Act & Assert
        mockMvc.perform(post("/api/personal-chats")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chat)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.personalChatId").value(1L));

        verify(personalChatRepository).save(any(PersonalChat.class));
    }

    @Test
    void createPersonalChat_NullRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/personal-chats")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(personalChatRepository, never()).save(any());
    }

    @Test
    void updatePersonalChat_Success() throws Exception {
        // Arrange
        Long chatId = 1L;
        PersonalChat chat = createTestPersonalChat(chatId);

        when(personalChatRepository.existsById(chatId)).thenReturn(true);
        when(personalChatRepository.save(any(PersonalChat.class))).thenReturn(chat);

        // Act & Assert
        mockMvc.perform(put("/api/personal-chats/{id}", chatId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chat)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalChatId").value(chatId));

        verify(personalChatRepository).existsById(chatId);
        verify(personalChatRepository).save(any(PersonalChat.class));
    }

    @Test
    void updatePersonalChat_NotFound() throws Exception {
        // Arrange
        Long chatId = 999L;
        PersonalChat chat = createTestPersonalChat(chatId);

        when(personalChatRepository.existsById(chatId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(put("/api/personal-chats/{id}", chatId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chat)))
                .andExpect(status().isNotFound());

        verify(personalChatRepository).existsById(chatId);
        verify(personalChatRepository, never()).save(any());
    }

    @Test
    void deletePersonalChat_Success() throws Exception {
        // Arrange
        Long chatId = 1L;
        when(personalChatRepository.existsById(chatId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/personal-chats/{id}", chatId))
                .andExpect(status().isNoContent());

        verify(personalChatRepository).existsById(chatId);
        verify(personalChatRepository).deleteById(chatId);
    }

    @Test
    void deletePersonalChat_NotFound() throws Exception {
        // Arrange
        Long chatId = 999L;
        when(personalChatRepository.existsById(chatId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/personal-chats/{id}", chatId))
                .andExpect(status().isNotFound());

        verify(personalChatRepository).existsById(chatId);
        verify(personalChatRepository, never()).deleteById(any());
    }

    @Test
    void getOrCreateExperienceChat_ExistingChat() throws Exception {
        // Arrange
        Long experienceId = 1L;
        Long touristId = 2L;
        Long guideId = 3L;
        PersonalChat existingChat = createTestPersonalChat(1L);

        when(personalChatRepository.findByExperienceAndTouristAndGuide(experienceId, touristId, guideId))
                .thenReturn(Optional.of(existingChat));

        // Act & Assert
        mockMvc.perform(post("/api/personal-chats/experience/{experienceId}/chat", experienceId)
                .param("touristId", String.valueOf(touristId))
                .param("guideId", String.valueOf(guideId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalChatId").value(1L));

        verify(personalChatRepository).findByExperienceAndTouristAndGuide(experienceId, touristId, guideId);
    }

    @Test
    void getOrCreateExperienceChat_CreateNewChat() throws Exception {
        // Arrange
        Long experienceId = 1L;
        Long touristId = 2L;
        Long guideId = 3L;

        Experience experience = createTestExperience(experienceId);
        User tourist = createTestUser(touristId);
        User guide = createTestUser(guideId);
        PersonalChat newChat = createTestPersonalChat(1L);

        when(personalChatRepository.findByExperienceAndTouristAndGuide(experienceId, touristId, guideId))
                .thenReturn(Optional.empty());
        when(experienceRepository.findById(experienceId)).thenReturn(Optional.of(experience));
        when(userRepository.findById(touristId)).thenReturn(Optional.of(tourist));
        when(userRepository.findById(guideId)).thenReturn(Optional.of(guide));
        when(personalChatRepository.save(any(PersonalChat.class))).thenReturn(newChat);

        // Act & Assert
        mockMvc.perform(post("/api/personal-chats/experience/{experienceId}/chat", experienceId)
                .param("touristId", String.valueOf(touristId))
                .param("guideId", String.valueOf(guideId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.personalChatId").value(1L));

        verify(personalChatRepository).save(any(PersonalChat.class));
        verify(chatMemberRepository, times(2)).save(any(ChatMember.class));
    }

    @Test
    void getUserChats_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        List<PersonalChat> userChats = Arrays.asList(createTestPersonalChat(1L));
        List<Long> chatIds = Arrays.asList(1L);
        List<Message> lastMessages = Arrays.asList(createTestMessage(1L));
        List<ChatUnreadCount> unreadCounts = Arrays.asList(createTestUnreadCount(1L, userId, 5));

        when(personalChatRepository.findChatsByUserId(userId)).thenReturn(userChats);
        when(personalChatRepository.findLastMessagesForChats(chatIds)).thenReturn(lastMessages);
        when(chatUnreadCountRepository.findByUserId(userId)).thenReturn(unreadCounts);

        // Act & Assert
        mockMvc.perform(get("/api/personal-chats/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(personalChatRepository).findChatsByUserId(userId);
        verify(chatUnreadCountRepository).findByUserId(userId);
    }

    @Test
    void markChatAsRead_Success() throws Exception {
        // Arrange
        Long chatId = 1L;
        Long userId = 2L;
        ChatUnreadCount unreadCount = createTestUnreadCount(chatId, userId, 5);
        Message lastMessage = createTestMessage(1L);

        when(chatUnreadCountRepository.findByChatIdAndUserId(chatId, userId))
                .thenReturn(Optional.of(unreadCount));
        when(messageRepository.findByPersonalChatIdOrderByCreatedAtDesc(chatId))
                .thenReturn(Arrays.asList(lastMessage));

        // Act & Assert
        mockMvc.perform(post("/api/personal-chats/{chatId}/mark-read", chatId)
                .param("userId", String.valueOf(userId)))
                .andExpect(status().isOk());

        verify(chatUnreadCountRepository).save(any(ChatUnreadCount.class));
    }

    @Test
    void getTotalUnreadCount_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        List<ChatUnreadCount> unreadCounts = Arrays.asList(
                createTestUnreadCount(1L, userId, 3),
                createTestUnreadCount(2L, userId, 7)
        );

        when(chatUnreadCountRepository.findByUserId(userId)).thenReturn(unreadCounts);

        // Act & Assert
        mockMvc.perform(get("/api/personal-chats/user/{userId}/unread-count", userId))
                .andExpect(status().isOk())
                .andExpect(content().string("10"));

        verify(chatUnreadCountRepository).findByUserId(userId);
    }

    // Helper methods
    private PersonalChat createTestPersonalChat(Long id) {
        PersonalChat chat = new PersonalChat();
        chat.setPersonalChatId(id);
        chat.setName("Test Chat");
        chat.setCreatedAt(LocalDateTime.now());
        chat.setChatMembers(new ArrayList<>());
        return chat;
    }

    private Experience createTestExperience(Long id) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle("Test Experience");
        return experience;
    }

    private User createTestUser(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("test" + id + "@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }

    private Message createTestMessage(Long id) {
        Message message = new Message();
        message.setMessageId(id);
        message.setContent("Test message");
        message.setCreatedAt(LocalDateTime.now());
        PersonalChat chat = createTestPersonalChat(1L);
        message.setPersonalChat(chat);
        return message;
    }

    private ChatUnreadCount createTestUnreadCount(Long chatId, Long userId, int count) {
        ChatUnreadCount unreadCount = new ChatUnreadCount();
        PersonalChat chat = createTestPersonalChat(chatId);
        User user = createTestUser(userId);
        unreadCount.setPersonalChat(chat);
        unreadCount.setUser(user);
        unreadCount.setUnreadCount(count);
        return unreadCount;
    }
}