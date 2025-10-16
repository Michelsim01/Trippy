package com.backend.repository;

import com.backend.entity.Notification;
import com.backend.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.backend.entity.User;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser(User user);
    
    // Find notifications by user ID, type, and created after a specific time
    List<Notification> findByUserIdAndTypeAndCreatedAtGreaterThan(Long userId, NotificationType type, LocalDateTime createdAt);
}
