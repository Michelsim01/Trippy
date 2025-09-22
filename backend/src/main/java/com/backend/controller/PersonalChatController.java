package com.backend.controller;

import com.backend.entity.PersonalChat;
import com.backend.repository.PersonalChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/personal-chats")
public class PersonalChatController {
    @Autowired
    private PersonalChatRepository personalChatRepository;

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
}
