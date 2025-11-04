package com.backend.repository;

import com.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    // Find all cart items for a user, ordered by most recent first
    List<CartItem> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // Find a specific cart item by user and schedule (to check for duplicates)
    Optional<CartItem> findByUser_IdAndExperienceSchedule_ScheduleId(Long userId, Long scheduleId);

    // Delete all cart items for a user (clear cart)
    void deleteByUser_Id(Long userId);

    // Count total items in user's cart
    long countByUser_Id(Long userId);
}
