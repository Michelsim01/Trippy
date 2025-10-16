package com.backend.controller;

import com.backend.dto.UserSurveyDTO;
import com.backend.service.UserSurveyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user-surveys")
@CrossOrigin(origins = "http://localhost:5173")
public class UserSurveyController {
    
    @Autowired
    private UserSurveyService userSurveyService;

    @GetMapping
    public ResponseEntity<List<UserSurveyDTO>> getAllUserSurveys() {
        try {
            List<UserSurveyDTO> userSurveys = userSurveyService.getAllUserSurveys();
            return ResponseEntity.ok(userSurveys);
        } catch (Exception e) {
            System.err.println("Error retrieving all user surveys: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserSurveyDTO> getUserSurveyById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<UserSurveyDTO> userSurvey = userSurveyService.getUserSurveyById(id);
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

    @GetMapping("/user/{userId}")
    public ResponseEntity<UserSurveyDTO> getUserSurveyByUserId(@PathVariable Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<UserSurveyDTO> userSurvey = userSurveyService.getUserSurveyByUserId(userId);
            if (userSurvey.isPresent()) {
                return ResponseEntity.ok(userSurvey.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving user survey for user ID " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}/exists")
    public ResponseEntity<java.util.Map<String, Boolean>> checkUserSurveyExists(@PathVariable Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            boolean exists = userSurveyService.checkUserSurveyExists(userId);
            java.util.Map<String, Boolean> response = new java.util.HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error checking if user survey exists for user ID " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createUserSurvey(@RequestBody UserSurveyDTO userSurveyDTO) {
        try {
            if (userSurveyDTO == null) {
                return ResponseEntity.badRequest().body("Survey data is required");
            }
            
            // Validate required fields
            if (userSurveyDTO.getUserId() == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            
            if (userSurveyDTO.getIntroduction() == null || userSurveyDTO.getIntroduction().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Introduction is required");
            }
            
            if (userSurveyDTO.getInterests() == null || userSurveyDTO.getInterests().size() != 5) {
                return ResponseEntity.badRequest().body("Exactly 5 interests are required");
            }
            
            if (userSurveyDTO.getTravelStyle() == null || userSurveyDTO.getTravelStyle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Travel style is required");
            }
            
            if (userSurveyDTO.getExperienceBudget() == null || userSurveyDTO.getExperienceBudget().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Experience budget is required");
            }
            
            System.out.println("Creating survey for user ID: " + userSurveyDTO.getUserId());
            System.out.println("Survey data: " + userSurveyDTO.toString());
            
            UserSurveyDTO savedUserSurvey = userSurveyService.createUserSurvey(userSurveyDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUserSurvey);
        } catch (Exception e) {
            System.err.println("Error creating user survey: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserSurvey(@PathVariable Long id, @RequestBody UserSurveyDTO userSurveyDTO) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("Invalid survey ID");
            }
            
            if (userSurveyDTO == null) {
                return ResponseEntity.badRequest().body("Survey data is required");
            }
            
            // Validate required fields
            if (userSurveyDTO.getUserId() == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            
            if (userSurveyDTO.getIntroduction() == null || userSurveyDTO.getIntroduction().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Introduction is required");
            }
            
            if (userSurveyDTO.getInterests() == null || userSurveyDTO.getInterests().size() != 5) {
                return ResponseEntity.badRequest().body("Exactly 5 interests are required");
            }
            
            if (userSurveyDTO.getTravelStyle() == null || userSurveyDTO.getTravelStyle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Travel style is required");
            }
            
            if (userSurveyDTO.getExperienceBudget() == null || userSurveyDTO.getExperienceBudget().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Experience budget is required");
            }
            
            System.out.println("Updating survey with ID: " + id);
            System.out.println("Survey data: " + userSurveyDTO.toString());
            
            Optional<UserSurveyDTO> updatedUserSurvey = userSurveyService.updateUserSurvey(id, userSurveyDTO);
            if (updatedUserSurvey.isPresent()) {
                return ResponseEntity.ok(updatedUserSurvey.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error updating user survey with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserSurvey(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            boolean deleted = userSurveyService.deleteUserSurvey(id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error deleting user survey with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
