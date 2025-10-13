package com.backend.controller;

import com.backend.entity.PersonalChat;
import com.backend.service.TripChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trip-chats")
public class TripChatController {
    @Autowired
    private TripChatService tripChatService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PersonalChat>> getUserTripChats(@PathVariable Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<PersonalChat> userTripChats = tripChatService.getUserTripChats(userId);
            return ResponseEntity.ok(userTripChats);
        } catch (Exception e) {
            System.err.println("Error retrieving trip chats for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
