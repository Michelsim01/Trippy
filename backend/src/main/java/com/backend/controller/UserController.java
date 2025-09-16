package com.backend.controller;

import com.backend.entity.User;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173") 
public class UserController {
    @Autowired
    private UserRepository userRepository;
    
    private final String UPLOAD_DIR = "uploads/profilepicture/";

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return userRepository.save(user);
    }

    @PutMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> updateUserDetails(@PathVariable Long id,
            @RequestBody Map<String, String> updates) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not found");
                return ResponseEntity.status(404).body(error);
            }

            if (updates.containsKey("firstName")) {
                user.setFirstName(updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName(updates.get("lastName"));
            }
            if (updates.containsKey("email")) {
                user.setEmail(updates.get("email"));
            }
            if (updates.containsKey("phoneNumber")) {
                user.setPhoneNumber(updates.get("phoneNumber"));
            }
            if (updates.containsKey("profileImageUrl")) {
                user.setProfileImageUrl(updates.get("profileImageUrl"));
            }

            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PutMapping("/{id}/changePassword")
    public ResponseEntity<Map<String, Object>> changeUserPassword(@PathVariable Long id,
            @RequestBody Map<String, String> passwordUpdate) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not found");
                return ResponseEntity.status(404).body(error);
            }

            String newPassword = passwordUpdate.get("newPassword");
            if (newPassword == null || newPassword.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "New password is required");
                return ResponseEntity.badRequest().body(error);
            }

            user.setPassword(newPassword);
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/{id}/verifyPassword")
    public ResponseEntity<Map<String, Boolean>> verifyPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordRequest) {

        try {
            String currentPassword = passwordRequest.get("password");
            if (currentPassword == null || currentPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("isValid", false));
            }
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isValid = user.getPassword().equals(currentPassword);
            System.out.println("Verifying password for user ID: " + currentPassword + " / " + user.getPassword());
            System.out.println("Password verification for user ID " + id + ": " + isValid);

            return ResponseEntity.ok(Map.of("isValid", isValid));

        } catch (Exception e) {
            System.err.println("Error verifying password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("isValid", false));
        }
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long id) {
        try {
            // Mock user statistics - in real app, this would aggregate from database
            Map<String, Object> stats = new HashMap<>();
            stats.put("rating", 4.9);
            stats.put("reviewCount", 256);
            stats.put("totalExperiences", 42);
            stats.put("completedBookings", 189);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/{id}/profile-picture")
    public ResponseEntity<Map<String, Object>> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not found");
                return ResponseEntity.status(404).body(error);
            }

            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No file selected");
                return ResponseEntity.badRequest().body(error);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Only image files are allowed");
                return ResponseEntity.badRequest().body(error);
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "File size too large. Maximum 5MB allowed");
                return ResponseEntity.badRequest().body(error);
            }

            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = "user_" + id + "_" + UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/api/users/profile-pictures/" + fileName;
            user.setProfileImageUrl(imageUrl);
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile picture uploaded successfully");
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to upload file");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/profile-pictures/{filename}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}