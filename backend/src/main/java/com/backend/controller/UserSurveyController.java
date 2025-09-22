package com.backend.controller;

import com.backend.entity.UserSurvey;
import com.backend.repository.UserSurveyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user-surveys")
public class UserSurveyController {
    @Autowired
    private UserSurveyRepository userSurveyRepository;

    @GetMapping
    public ResponseEntity<List<UserSurvey>> getAllUserSurveys() {
        try {
            List<UserSurvey> userSurveys = userSurveyRepository.findAll();
            return ResponseEntity.ok(userSurveys);
        } catch (Exception e) {
            System.err.println("Error retrieving all user surveys: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserSurvey> getUserSurveyById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<UserSurvey> userSurvey = userSurveyRepository.findById(id);
            if (userSurvey.isPresent()) {
                return ResponseEntity.ok(userSurvey.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving user survey with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<UserSurvey> createUserSurvey(@RequestBody UserSurvey userSurvey) {
        try {
            if (userSurvey == null) {
                return ResponseEntity.badRequest().build();
            }
            
            UserSurvey savedUserSurvey = userSurveyRepository.save(userSurvey);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUserSurvey);
        } catch (Exception e) {
            System.err.println("Error creating user survey: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserSurvey> updateUserSurvey(@PathVariable Long id, @RequestBody UserSurvey userSurvey) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (userSurvey == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!userSurveyRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            userSurvey.setSurveyId(id);
            UserSurvey savedUserSurvey = userSurveyRepository.save(userSurvey);
            return ResponseEntity.ok(savedUserSurvey);
        } catch (Exception e) {
            System.err.println("Error updating user survey with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserSurvey(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!userSurveyRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            userSurveyRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting user survey with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
