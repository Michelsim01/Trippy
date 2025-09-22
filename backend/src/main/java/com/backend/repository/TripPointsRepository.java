package com.backend.repository;

import com.backend.entity.TripPoints;
import com.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripPointsRepository extends JpaRepository<TripPoints, Long> {
    
    /**
     * Find TripPoints by user ID
     */
    Optional<TripPoints> findByUserId(Long userId);
    
    /**
     * Find TripPoints by user entity
     */
    Optional<TripPoints> findByUser(User user);
    
    /**
     * Get all TripPoints ordered by total earned (descending)
     */
    @Query("SELECT tp FROM TripPoints tp ORDER BY tp.totalEarned DESC")
    List<TripPoints> findAllOrderByTotalEarnedDesc();
    
    /**
     * Get all TripPoints ordered by current balance (descending)
     */
    @Query("SELECT tp FROM TripPoints tp ORDER BY tp.pointsBalance DESC")
    List<TripPoints> findAllOrderByPointsBalanceDesc();
    
    /**
     * Check if user has TripPoints record
     */
    boolean existsByUserId(Long userId);
}