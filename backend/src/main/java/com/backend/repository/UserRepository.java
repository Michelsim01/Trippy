package com.backend.repository;

import com.backend.entity.KycStatus;
import com.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity operations.
 * Provides methods for database access and custom queries.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 1. Basic user lookup methods
    
    /**
     * Find a user by email address.
     * 
     * @param email The email address to search for
     * @return Optional containing the user if found, empty otherwise
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if a user exists with the given email address.
     * 
     * @param email The email address to check
     * @return true if user exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Find a user by email and active status.
     * 
     * @param email The email address to search for
     * @param isActive The active status to filter by
     * @return Optional containing the user if found, empty otherwise
     */
    Optional<User> findByEmailAndIsActive(String email, Boolean isActive);
    
    // 2. User capability and role methods
    
    /**
     * Find users who can create experiences (guides).
     * 
     * @param canCreateExperiences Whether the user can create experiences
     * @return List of users who can create experiences
     */
    List<User> findByCanCreateExperiences(Boolean canCreateExperiences);
    
    /**
     * Find admin users.
     * 
     * @param isAdmin Whether the user is an admin
     * @return List of admin users
     */
    List<User> findByIsAdmin(Boolean isAdmin);
    
    /**
     * Find users by active status.
     * 
     * @param isActive Whether the user is active
     * @return List of users with the specified active status
     */
    List<User> findByIsActive(Boolean isActive);
    
    // 3. KYC status methods
    
    /**
     * Find users by KYC status.
     * 
     * @param kycStatus The KYC status to filter by
     * @return List of users with the specified KYC status
     */
    List<User> findByKycStatus(KycStatus kycStatus);
    
    /**
     * Find users who can create experiences and have approved KYC.
     * 
     * @param canCreateExperiences Whether the user can create experiences
     * @param kycStatus The KYC status (should be APPROVED)
     * @return List of approved guide users
     */
    List<User> findByCanCreateExperiencesAndKycStatus(Boolean canCreateExperiences, KycStatus kycStatus);
    
    /**
     * Find users with pending KYC applications.
     * 
     * @param kycStatus The KYC status (should be PENDING)
     * @return List of users with pending KYC
     */
    List<User> findByKycStatusOrderByKycSubmittedAtAsc(KycStatus kycStatus);
    
    // 4. Email verification methods
    
    /**
     * Find users by email verification status.
     * 
     * @param isEmailVerified Whether the email is verified
     * @return List of users with the specified email verification status
     */
    List<User> findByIsEmailVerified(Boolean isEmailVerified);
    
    /**
     * Find users who are active but have not verified their email.
     * 
     * @param isActive Whether the user is active
     * @param isEmailVerified Whether the email is verified
     * @return List of active users with unverified emails
     */
    List<User> findByIsActiveAndIsEmailVerified(Boolean isActive, Boolean isEmailVerified);
    
    // 5. Search and filter methods
    
    /**
     * Find users by first name containing the given string (case-insensitive).
     * 
     * @param firstName The first name to search for
     * @return List of users with matching first names
     */
    List<User> findByFirstNameContainingIgnoreCase(String firstName);
    
    /**
     * Find users by last name containing the given string (case-insensitive).
     * 
     * @param lastName The last name to search for
     * @return List of users with matching last names
     */
    List<User> findByLastNameContainingIgnoreCase(String lastName);
    
    /**
     * Find users by full name containing the given string (case-insensitive).
     * 
     * @param firstName The first name to search for
     * @param lastName The last name to search for
     * @return List of users with matching names
     */
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);
    
    // 6. Date-based queries
    
    /**
     * Find users created after a specific date.
     * 
     * @param createdAt The creation date to filter by
     * @return List of users created after the specified date
     */
    List<User> findByCreatedAtAfter(LocalDateTime createdAt);
    
    /**
     * Find users who logged in after a specific date.
     * 
     * @param lastLoginAt The last login date to filter by
     * @return List of users who logged in after the specified date
     */
    List<User> findByLastLoginAtAfter(LocalDateTime lastLoginAt);
    
    /**
     * Find users who haven't logged in for a specific period.
     * 
     * @param lastLoginAt The last login date to filter by
     * @return List of users who haven't logged in since the specified date
     */
    List<User> findByLastLoginAtBefore(LocalDateTime lastLoginAt);
    
    // 7. Custom queries
    
    /**
     * Find users by multiple criteria for admin dashboard.
     * 
     * @param isActive Whether the user is active
     * @param canCreateExperiences Whether the user can create experiences
     * @param kycStatus The KYC status
     * @return List of users matching all criteria
     */
    @Query("SELECT u FROM User u WHERE u.isActive = :isActive AND u.canCreateExperiences = :canCreateExperiences AND u.kycStatus = :kycStatus")
    List<User> findUsersByMultipleCriteria(@Param("isActive") Boolean isActive, 
                                         @Param("canCreateExperiences") Boolean canCreateExperiences, 
                                         @Param("kycStatus") KycStatus kycStatus);
    
    /**
     * Count users by KYC status.
     * 
     * @param kycStatus The KYC status to count
     * @return Number of users with the specified KYC status
     */
    long countByKycStatus(KycStatus kycStatus);
    
    /**
     * Count active users.
     * 
     * @param isActive Whether the user is active
     * @return Number of active users
     */
    long countByIsActive(Boolean isActive);
    
    /**
     * Count users who can create experiences.
     * 
     * @param canCreateExperiences Whether the user can create experiences
     * @return Number of users who can create experiences
     */
    long countByCanCreateExperiences(Boolean canCreateExperiences);
    
    /**
     * Find users with expired KYC submissions (submitted more than 30 days ago but still pending).
     * 
     * @param kycStatus The KYC status (should be PENDING)
     * @param expiredDate The date to check against (30 days ago)
     * @return List of users with expired KYC submissions
     */
    @Query("SELECT u FROM User u WHERE u.kycStatus = :kycStatus AND u.kycSubmittedAt < :expiredDate")
    List<User> findUsersWithExpiredKyc(@Param("kycStatus") KycStatus kycStatus, 
                                      @Param("expiredDate") LocalDateTime expiredDate);
    
    /**
     * Find users who need to verify their email (created more than 24 hours ago but email not verified).
     * 
     * @param isEmailVerified Whether the email is verified
     * @param createdAt The creation date to check against (24 hours ago)
     * @return List of users who need email verification
     */
    @Query("SELECT u FROM User u WHERE u.isEmailVerified = :isEmailVerified AND u.createdAt < :createdAt")
    List<User> findUsersNeedingEmailVerification(@Param("isEmailVerified") Boolean isEmailVerified, 
                                                @Param("createdAt") LocalDateTime createdAt);
}
