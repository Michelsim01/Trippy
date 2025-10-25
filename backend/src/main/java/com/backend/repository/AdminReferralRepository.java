package com.backend.repository;

import com.backend.entity.AdminReferral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for AdminReferral entity operations.
 */
@Repository
public interface AdminReferralRepository extends JpaRepository<AdminReferral, Long> {
    
    /**
     * Find a referral by referral token.
     * 
     * @param referralToken The referral token to search for
     * @return Optional containing the referral if found, empty otherwise
     */
    Optional<AdminReferral> findByReferralToken(String referralToken);
    
    /**
     * Find referrals by referred email.
     * 
     * @param referredEmail The email address that was referred
     * @return List of referrals for the given email
     */
    List<AdminReferral> findByReferredEmail(String referredEmail);
    
    /**
     * Find referrals by referrer ID.
     * 
     * @param referrerId The ID of the admin who made the referral
     * @return List of referrals made by the given admin
     */
    List<AdminReferral> findByReferrerId(Long referrerId);
    
    /**
     * Find active (unused and not expired) referrals by referred email.
     * 
     * @param referredEmail The email address that was referred
     * @return List of active referrals for the given email
     */
    @Query("SELECT ar FROM AdminReferral ar WHERE ar.referredEmail = :referredEmail " +
           "AND ar.isUsed = false AND ar.expiresAt > :now")
    List<AdminReferral> findActiveByReferredEmail(@Param("referredEmail") String referredEmail, 
                                                @Param("now") LocalDateTime now);
    
    /**
     * Find active (unused and not expired) referral by token.
     * 
     * @param referralToken The referral token
     * @return Optional containing the active referral if found, empty otherwise
     */
    @Query("SELECT ar FROM AdminReferral ar WHERE ar.referralToken = :referralToken " +
           "AND ar.isUsed = false AND ar.expiresAt > :now")
    Optional<AdminReferral> findActiveByReferralToken(@Param("referralToken") String referralToken, 
                                                     @Param("now") LocalDateTime now);
    
    /**
     * Count referrals by referrer ID.
     * 
     * @param referrerId The ID of the admin who made the referral
     * @return Number of referrals made by the given admin
     */
    long countByReferrerId(Long referrerId);
    
    /**
     * Count used referrals by referrer ID.
     * 
     * @param referrerId The ID of the admin who made the referral
     * @return Number of used referrals made by the given admin
     */
    long countByReferrerIdAndIsUsed(Long referrerId, Boolean isUsed);
    
    /**
     * Find expired referrals.
     * 
     * @param now Current time
     * @return List of expired referrals
     */
    @Query("SELECT ar FROM AdminReferral ar WHERE ar.expiresAt <= :now AND ar.isUsed = false")
    List<AdminReferral> findExpiredReferrals(@Param("now") LocalDateTime now);
}
