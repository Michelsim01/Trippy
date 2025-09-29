package com.backend.controller;

import com.backend.entity.PersonalChat;
import com.backend.entity.ChatMember;
import com.backend.entity.Experience;
import com.backend.entity.User;
import com.backend.entity.Message;
import com.backend.entity.ChatRoleEnum;
import com.backend.entity.ChatUnreadCount;
import com.backend.repository.PersonalChatRepository;
import com.backend.repository.ChatMemberRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.MessageRepository;
import com.backend.repository.ChatUnreadCountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/personal-chats")
@CrossOrigin(origins = "http://localhost:3000")
public class PersonalChatController {
    @Autowired
    private PersonalChatRepository personalChatRepository;
    
    @Autowired
    private ChatMemberRepository chatMemberRepository;
    
    @Autowired
    private ExperienceRepository experienceRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private ChatUnreadCountRepository chatUnreadCountRepository;

    @GetMapping
    public ResponseEntity<List<PersonalChat>> getAllPersonalChats() {
        try {
            List<PersonalChat> personalChats = personalChatRepository.findAll();
            return ResponseEntity.ok(personalChats);
        } catch (Exception e) {
            System.err.println("Error retrieving all personal chats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonalChat> getPersonalChatById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<PersonalChat> personalChat = personalChatRepository.findById(id);
            if (personalChat.isPresent()) {
                return ResponseEntity.ok(personalChat.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving personal chat with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<PersonalChat> createPersonalChat(@RequestBody PersonalChat personalChat) {
        try {
            if (personalChat == null) {
                return ResponseEntity.badRequest().build();
            }
            
            PersonalChat savedPersonalChat = personalChatRepository.save(personalChat);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPersonalChat);
        } catch (Exception e) {
            System.err.println("Error creating personal chat: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonalChat> updatePersonalChat(@PathVariable Long id, @RequestBody PersonalChat personalChat) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (personalChat == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!personalChatRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            personalChat.setPersonalChatId(id);
            PersonalChat savedPersonalChat = personalChatRepository.save(personalChat);
            return ResponseEntity.ok(savedPersonalChat);
        } catch (Exception e) {
            System.err.println("Error updating personal chat with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePersonalChat(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!personalChatRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            personalChatRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting personal chat with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/experience/{experienceId}/chat")
    public ResponseEntity<PersonalChat> getOrCreateExperienceChat(
            @PathVariable Long experienceId,
            @RequestParam Long touristId,
            @RequestParam Long guideId) {
        try {
            System.out.println("Creating chat for experienceId: " + experienceId + ", touristId: " + touristId + ", guideId: " + guideId);
            Optional<PersonalChat> existingChat = personalChatRepository
                .findByExperienceAndTouristAndGuide(experienceId, touristId, guideId);
            
            if (existingChat.isPresent()) {
                return ResponseEntity.ok(existingChat.get());
            }
            
            Optional<Experience> experience = experienceRepository.findById(experienceId);
            Optional<User> tourist = userRepository.findById(touristId);
            Optional<User> guide = userRepository.findById(guideId);
            
            if (experience.isEmpty() || tourist.isEmpty() || guide.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            PersonalChat newChat = new PersonalChat();
            newChat.setExperience(experience.get());
            newChat.setName(experience.get().getTitle() + " - Chat");
            newChat.setCreatedAt(LocalDateTime.now());
            newChat.setChatMembers(new ArrayList<>());
            
            PersonalChat savedChat = personalChatRepository.save(newChat);
            
            ChatMember touristMember = new ChatMember();
            touristMember.setPersonalChat(savedChat);
            touristMember.setUser(tourist.get());
            touristMember.setRole(ChatRoleEnum.MEMBER);
            touristMember.setCreatedAt(LocalDateTime.now());
            
            ChatMember guideMember = new ChatMember();
            guideMember.setPersonalChat(savedChat);
            guideMember.setUser(guide.get());
            guideMember.setRole(ChatRoleEnum.ADMIN);
            guideMember.setCreatedAt(LocalDateTime.now());
            
            chatMemberRepository.save(touristMember);
            chatMemberRepository.save(guideMember);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedChat);
            
        } catch (Exception e) {
            System.err.println("Error creating experience chat: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PersonalChat>> getUserChats(@PathVariable Long userId) {
        try {
            List<PersonalChat> userChats = personalChatRepository.findChatsByUserId(userId);
            
            if (!userChats.isEmpty()) {
                // Get all chat IDs
                List<Long> chatIds = userChats.stream()
                    .map(PersonalChat::getPersonalChatId)
                    .collect(Collectors.toList());
                
                // Get last messages for all chats in one query
                List<Message> lastMessages = personalChatRepository.findLastMessagesForChats(chatIds);
                
                // Create a map for quick lookup
                var lastMessageMap = lastMessages.stream()
                    .collect(Collectors.toMap(
                        m -> m.getPersonalChat().getPersonalChatId(),
                        m -> m
                    ));
                
                // Get unread counts for all chats
                List<ChatUnreadCount> unreadCounts = chatUnreadCountRepository.findByUserId(userId);
                var unreadCountMap = unreadCounts.stream()
                    .collect(Collectors.toMap(
                        uc -> uc.getPersonalChat().getPersonalChatId(),
                        ChatUnreadCount::getUnreadCount
                    ));
                
                // Populate last message and unread count for each chat
                for (PersonalChat chat : userChats) {
                    Message lastMessage = lastMessageMap.get(chat.getPersonalChatId());
                    if (lastMessage != null) {
                        chat.setLastMessage(lastMessage.getContent());
                        chat.setLastMessageTime(lastMessage.getCreatedAt());
                    }
                    
                    // Set unread count
                    Integer unreadCount = unreadCountMap.getOrDefault(chat.getPersonalChatId(), 0);
                    chat.setUnreadCount(unreadCount);
                }
            }
            
            return ResponseEntity.ok(userChats);
        } catch (Exception e) {
            System.err.println("Error retrieving chats for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping("/{chatId}/mark-read")
    public ResponseEntity<Void> markChatAsRead(@PathVariable Long chatId, @RequestParam Long userId) {
        try {
            Optional<ChatUnreadCount> unreadCountOpt = chatUnreadCountRepository.findByChatIdAndUserId(chatId, userId);
            
            if (unreadCountOpt.isPresent()) {
                ChatUnreadCount unreadCount = unreadCountOpt.get();
                unreadCount.setUnreadCount(0);
                
                // Set last read message to the latest message
                List<Message> lastMessages = messageRepository.findByPersonalChatIdOrderByCreatedAtDesc(chatId);
                if (!lastMessages.isEmpty()) {
                    unreadCount.setLastReadMessageId(lastMessages.get(0).getMessageId());
                }
                
                chatUnreadCountRepository.save(unreadCount);
            } else {
                // Create initial unread count record
                Optional<PersonalChat> chatOpt = personalChatRepository.findById(chatId);
                Optional<User> userOpt = userRepository.findById(userId);
                
                if (chatOpt.isPresent() && userOpt.isPresent()) {
                    ChatUnreadCount unreadCount = new ChatUnreadCount(chatOpt.get(), userOpt.get());
                    
                    // Set last read message to the latest message
                    List<Message> lastMessages = messageRepository.findByPersonalChatIdOrderByCreatedAtDesc(chatId);
                    if (!lastMessages.isEmpty()) {
                        unreadCount.setLastReadMessageId(lastMessages.get(0).getMessageId());
                    }
                    
                    chatUnreadCountRepository.save(unreadCount);
                }
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error marking chat as read: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Integer> getTotalUnreadCount(@PathVariable Long userId) {
        try {
            List<ChatUnreadCount> unreadCounts = chatUnreadCountRepository.findByUserId(userId);
            Integer totalUnread = unreadCounts.stream()
                .mapToInt(ChatUnreadCount::getUnreadCount)
                .sum();
            
            return ResponseEntity.ok(totalUnread);
        } catch (Exception e) {
            System.err.println("Error getting total unread count for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
