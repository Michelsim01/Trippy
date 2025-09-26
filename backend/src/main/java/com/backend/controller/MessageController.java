package com.backend.controller;

import com.backend.entity.Message;
import com.backend.entity.PersonalChat;
import com.backend.entity.User;
import com.backend.entity.MessageTypeEnum;
import com.backend.repository.MessageRepository;
import com.backend.repository.PersonalChatRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private PersonalChatRepository personalChatRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages() {
        try {
            List<Message> messages = messageRepository.findAll();
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Error retrieving all messages: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Message> getMessageById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<Message> message = messageRepository.findById(id);
            if (message.isPresent()) {
                return ResponseEntity.ok(message.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving message with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Message> createMessage(@RequestBody Message message) {
        try {
            if (message == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Message savedMessage = messageRepository.save(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
        } catch (Exception e) {
            System.err.println("Error creating message: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Message> updateMessage(@PathVariable Long id, @RequestBody Message message) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (message == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!messageRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            message.setMessageId(id);
            Message savedMessage = messageRepository.save(message);
            return ResponseEntity.ok(savedMessage);
        } catch (Exception e) {
            System.err.println("Error updating message with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!messageRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            messageRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting message with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<Message>> getMessagesByChatId(@PathVariable Long chatId) {
        try {
            if (chatId == null || chatId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            List<Message> messages = messageRepository.findByPersonalChatIdOrderByCreatedAt(chatId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Error retrieving messages for chat " + chatId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping("/chat/{chatId}/send")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long chatId,
            @RequestParam Long senderId,
            @RequestBody MessageRequest messageRequest) {
        try {
            if (chatId == null || chatId <= 0 || senderId == null || senderId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (messageRequest == null || messageRequest.getContent() == null || messageRequest.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<PersonalChat> personalChat = personalChatRepository.findById(chatId);
            Optional<User> sender = userRepository.findById(senderId);
            
            if (personalChat.isEmpty() || sender.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            Message message = new Message();
            message.setPersonalChat(personalChat.get());
            message.setSender(sender.get());
            message.setContent(messageRequest.getContent());
            message.setMessageType(MessageTypeEnum.TEXT);
            message.setCreatedAt(LocalDateTime.now());
            message.setUpdatedAt(LocalDateTime.now());
            
            Message savedMessage = messageRepository.save(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
            
        } catch (Exception e) {
            System.err.println("Error sending message to chat " + chatId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    public static class MessageRequest {
        private String content;
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
