package com.backend.repository;

import com.backend.entity.TripPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripPointsRepository extends JpaRepository<TripPoints, Long> {
    
    /**
     * Find all TripPoints transactions for a user, ordered by latest first
     */
    @Query("SELECT tp FROM TripPoints tp WHERE tp.user.id = :userId ORDER BY tp.createdAt DESC")
    List<TripPoints> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    /**
     * Find the latest TripPoints transaction for a user
     */
    @Query(value = "SELECT * FROM trip_points tp WHERE tp.user_id = :userId ORDER BY tp.created_at DESC LIMIT 1", nativeQuery = true)
    Optional<TripPoints> findLatestByUserId(@Param("userId") Long userId);
    
    /**
     * Get current balance for a user (from latest transaction)
     */
    @Query(value = "SELECT COALESCE(tp.points_balance_after, 0) FROM trip_points tp WHERE tp.user_id = :userId ORDER BY tp.created_at DESC LIMIT 1", nativeQuery = true)
    Integer getCurrentBalanceByUserId(@Param("userId") Long userId);
    
    /**
     * Get total earned points for a user
     */
    @Query("SELECT COALESCE(SUM(tp.pointsChange), 0) FROM TripPoints tp WHERE tp.user.id = :userId AND tp.pointsChange > 0")
    Integer getTotalEarnedByUserId(@Param("userId") Long userId);
    
    /**
     * Get total redeemed points for a user
     */
    @Query("SELECT COALESCE(SUM(ABS(tp.pointsChange)), 0) FROM TripPoints tp WHERE tp.user.id = :userId AND tp.pointsChange < 0")
    Integer getTotalRedeemedByUserId(@Param("userId") Long userId);
    
    /**
     * Check if user has any TripPoints transactions
     */
    @Query("SELECT COUNT(tp) > 0 FROM TripPoints tp WHERE tp.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);
}