package com.backend.controller;

import com.backend.entity.TripChat;
import com.backend.repository.TripChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-chats")
public class TripChatController {
    @Autowired
    private TripChatRepository tripChatRepository;

    @GetMapping
    public ResponseEntity<List<TripChat>> getAllTripChats() {
        try {
            List<TripChat> tripChats = tripChatRepository.findAll();
            return ResponseEntity.ok(tripChats);
        } catch (Exception e) {
            System.err.println("Error retrieving all trip chats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripChat> getTripChatById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<TripChat> tripChat = tripChatRepository.findById(id);
            if (tripChat.isPresent()) {
                return ResponseEntity.ok(tripChat.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving trip chat with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<TripChat> createTripChat(@RequestBody TripChat tripChat) {
        try {
            if (tripChat == null) {
                return ResponseEntity.badRequest().build();
            }
            
            TripChat savedTripChat = tripChatRepository.save(tripChat);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTripChat);
        } catch (Exception e) {
            System.err.println("Error creating trip chat: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripChat> updateTripChat(@PathVariable Long id, @RequestBody TripChat tripChat) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (tripChat == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!tripChatRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            tripChat.setTripChatId(id);
            TripChat savedTripChat = tripChatRepository.save(tripChat);
            return ResponseEntity.ok(savedTripChat);
        } catch (Exception e) {
            System.err.println("Error updating trip chat with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTripChat(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!tripChatRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            tripChatRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting trip chat with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
