package com.backend.repository;

import com.backend.entity.PendingUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository interface for PendingUser entity operations.
 * Handles database operations for pending user registrations.
 */
@Repository
public interface PendingUserRepository extends JpaRepository<PendingUser, Long> {
    
    /**
     * Find pending user by email
     */
    Optional<PendingUser> findByEmail(String email);
    
    /**
     * Find pending user by verification token
     */
    Optional<PendingUser> findByVerificationToken(String verificationToken);
    
    /**
     * Check if pending user exists by email
     */
    boolean existsByEmail(String email);
    
    /**
     * Delete pending user by email
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PendingUser p WHERE p.email = :email")
    void deleteByEmail(@Param("email") String email);
    
    /**
     * Delete pending user by verification token
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PendingUser p WHERE p.verificationToken = :token")
    void deleteByVerificationToken(@Param("token") String verificationToken);
    
    /**
     * Delete all expired pending users
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PendingUser p WHERE p.expiresAt < :now")
    void deleteExpiredPendingUsers(@Param("now") LocalDateTime now);
    
    /**
     * Find all expired pending users
     */
    @Query("SELECT p FROM PendingUser p WHERE p.expiresAt < :now")
    java.util.List<PendingUser> findExpiredPendingUsers(@Param("now") LocalDateTime now);
}
