package com.backend.controller;

import com.backend.entity.ChatMember;
import com.backend.repository.ChatMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat-members")
public class ChatMemberController {
    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @GetMapping
    public ResponseEntity<List<ChatMember>> getAllChatMembers() {
        try {
            List<ChatMember> chatMembers = chatMemberRepository.findAll();
            return ResponseEntity.ok(chatMembers);
        } catch (Exception e) {
            System.err.println("Error retrieving all chat members: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatMember> getChatMemberById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<ChatMember> chatMember = chatMemberRepository.findById(id);
            if (chatMember.isPresent()) {
                return ResponseEntity.ok(chatMember.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving chat member with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<ChatMember> createChatMember(@RequestBody ChatMember chatMember) {
        try {
            if (chatMember == null) {
                return ResponseEntity.badRequest().build();
            }
            
            ChatMember savedChatMember = chatMemberRepository.save(chatMember);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedChatMember);
        } catch (Exception e) {
            System.err.println("Error creating chat member: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChatMember> updateChatMember(@PathVariable Long id, @RequestBody ChatMember chatMember) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (chatMember == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!chatMemberRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            chatMember.setId(id);
            ChatMember savedChatMember = chatMemberRepository.save(chatMember);
            return ResponseEntity.ok(savedChatMember);
        } catch (Exception e) {
            System.err.println("Error updating chat member with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChatMember(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!chatMemberRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            chatMemberRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting chat member with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
