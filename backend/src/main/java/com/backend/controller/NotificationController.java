package com.backend.controller;

import com.backend.entity.Notification;
import com.backend.entity.NotificationType;
import com.backend.entity.User;
import com.backend.repository.UserRepository;
import com.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @GetMapping("/{id}")
    public Notification getNotificationById(@PathVariable Long id) {
        return notificationRepository.findById(id).orElse(null);
    }

    @GetMapping("/users/{userId}")
    public List<Notification> getNotificationsByUserId(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return List.of();
        }
        return notificationRepository.findByUser(user);
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Map<String, Object> payload) {
        try {
            Notification notification = new Notification();
            notification.setTitle((String) payload.get("title"));
            notification.setMessage((String) payload.get("message"));

            Number userIdNum = (Number) payload.get("userId");
            if (userIdNum == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            Long userId = userIdNum.longValue();

            User user = userRepository.findById(userId).orElse(null);

            if (user == null) {
                return ResponseEntity.badRequest().body("User not found with ID: " + userId);
            }

            notification.setUser(user);

            String typeStr = (String) payload.get("type");
            if (typeStr != null) {
                try {
                    notification.setType(NotificationType.valueOf(typeStr));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body("Invalid notification type: " + typeStr);
                }
            }
            notification.setIsRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setSentAt(LocalDateTime.now());
            Notification savedNotification = notificationRepository.save(notification);
            return ResponseEntity.ok(savedNotification);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating notification: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Notification updateNotification(@PathVariable Long id, @RequestBody Notification notification) {
        notification.setNotificationId(id);
        return notificationRepository.save(notification);
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
    }
}
