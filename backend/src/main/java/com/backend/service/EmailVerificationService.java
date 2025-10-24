package com.backend.service;

import com.backend.dto.response.EmailVerificationResponse;
import com.backend.entity.User;
import com.backend.entity.PendingUser;
import com.backend.repository.UserRepository;
import com.backend.repository.PendingUserRepository;
import com.backend.service.AdminReferralService;
import com.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for handling email verification functionality.
 * Manages email verification token generation, validation, and email verification.
 */
@Service
public class EmailVerificationService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PendingUserRepository pendingUserRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private AdminReferralService adminReferralService;
    
    // Token expiration time: 24 hours
    private static final int TOKEN_EXPIRATION_HOURS = 24;
    
    // In-memory cache to track verified profile update emails
    // This is a simple solution - in production you might use Redis or database table
    private final ConcurrentHashMap<String, LocalDateTime> verifiedProfileEmails = new ConcurrentHashMap<>();
    
    /**
     * Generate a verification token.
     * 
     * @return A unique verification token
     */
    public String generateVerificationToken() {
        return UUID.randomUUID().toString();
    }
    
    /**
     * Send verification email with the provided token.
     * 
     * @param email The email address to send to
     * @param token The verification token
     */
    public void sendVerificationEmail(String email, String token) throws Exception {
        // Extract first name from pending user if available
        Optional<PendingUser> pendingUser = pendingUserRepository.findByVerificationToken(token);
        String firstName = pendingUser.map(PendingUser::getFirstName).orElse("User");
        
        emailService.sendEmailVerificationEmail(email, token, firstName);
    }
    
    /**
     * Generate and send email verification token for the given email.
     * 
     * @param email The email address to send verification to
     * @return EmailVerificationResponse with success status and message
     */
    public EmailVerificationResponse generateAndSendVerificationToken(String email) {
        try {
            // First check if this is a pending user (hasn't verified email yet)
            Optional<PendingUser> pendingUserOptional = pendingUserRepository.findByEmail(email);
            
            if (pendingUserOptional.isPresent()) {
                PendingUser pendingUser = pendingUserOptional.get();
                
                // Check if pending registration is expired
                if (pendingUser.isExpired()) {
                    // Clean up expired pending user
                    cleanupPendingUser(pendingUser);
                    return new EmailVerificationResponse(false, "Registration has expired. Please register again.");
                }
                
                // Generate a new verification token for pending user
                String verificationToken = UUID.randomUUID().toString();
                pendingUser.setVerificationToken(verificationToken);
                pendingUser.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HOURS));
                
                // Save updated pending user
                pendingUserRepository.save(pendingUser);
                
                // Send verification email
                try {
                    emailService.sendEmailVerificationEmail(pendingUser.getEmail(), verificationToken, pendingUser.getFirstName());
                    return new EmailVerificationResponse(true, "Verification email sent successfully to: " + email);
                } catch (Exception e) {
                    // Log the error but don't fail the token generation
                    System.err.println("Failed to send verification email: " + e.getMessage());
                    return new EmailVerificationResponse(false, "Failed to send verification email. Please try again.");
                }
            }
            
            // If not a pending user, check if it's an existing user who needs re-verification
            Optional<User> userOptional = userRepository.findByEmailAndIsActive(email, true);
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                
                // Check if email is already verified
                if (user.getIsEmailVerified()) {
                    return new EmailVerificationResponse(true, "Email is already verified", true);
                }
                
                // Generate a unique verification token
                String verificationToken = UUID.randomUUID().toString();
                
                // Set token and expiration time
                user.setEmailVerificationToken(verificationToken);
                user.setEmailVerificationTokenExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HOURS));
                
                // Save user with verification token
                userRepository.save(user);
                
                // Send verification email
                try {
                    emailService.sendEmailVerificationEmail(user.getEmail(), verificationToken, user.getFirstName());
                    return new EmailVerificationResponse(true, "Verification email sent successfully to: " + email);
                } catch (Exception e) {
                    // Log the error but don't fail the token generation
                    System.err.println("Failed to send verification email: " + e.getMessage());
                    return new EmailVerificationResponse(false, "Failed to send verification email. Please try again.");
                }
            }
            
            // If no existing user or pending user found, this might be for a profile update
            // Create a temporary verification record for profile updates
            String verificationToken = UUID.randomUUID().toString();
            
            // Create a temporary pending user record for the verification
            PendingUser tempVerification = new PendingUser();
            tempVerification.setEmail(email);
            tempVerification.setFirstName("User"); // Default name for profile updates
            tempVerification.setLastName("");
            tempVerification.setPassword("PROFILE_UPDATE_TEMP"); // Special marker
            tempVerification.setVerificationToken(verificationToken);
            tempVerification.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HOURS));
            tempVerification.setCreatedAt(LocalDateTime.now()); // Set created_at to avoid null constraint violation
            
            // Save the temporary verification record
            pendingUserRepository.save(tempVerification);
            
            // Send verification email
            try {
                emailService.sendEmailVerificationEmail(email, verificationToken, "User");
                return new EmailVerificationResponse(true, "Verification email sent successfully to: " + email);
            } catch (Exception e) {
                // Clean up the temporary record if email sending fails
                pendingUserRepository.delete(tempVerification);
                System.err.println("Failed to send verification email: " + e.getMessage());
                return new EmailVerificationResponse(false, "Failed to send verification email. Please try again.");
            }
            
        } catch (Exception e) {
            return new EmailVerificationResponse(false, "An error occurred: " + e.getMessage());
        }
    }
    
    /**
     * Verify email using the provided token.
     * First checks for pending users, then existing users.
     * If pending user found, creates actual user account.
     * 
     * @param token The verification token
     * @return EmailVerificationResponse with verification status
     */
    public EmailVerificationResponse verifyEmail(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return new EmailVerificationResponse(false, "Invalid verification token");
            }
            
            // Check if this is a pending user registration
            Optional<PendingUser> pendingUserOptional = pendingUserRepository.findByVerificationToken(token);
            
            if (pendingUserOptional.isPresent()) {
                PendingUser pendingUser = pendingUserOptional.get();
                
                // Check if pending registration is expired
                if (pendingUser.isExpired()) {
                    // Clean up expired pending user
                    cleanupPendingUser(pendingUser);
                    return new EmailVerificationResponse(false, "Verification token has expired. Please register again.");
                }
                
                // Check if this is a profile update verification (temporary record)
                if (pendingUser.getPassword().equals("PROFILE_UPDATE_TEMP")) {
                    // This is a profile update verification - mark email as verified in cache
                    String email = pendingUser.getEmail();
                    verifiedProfileEmails.put(email, LocalDateTime.now().plusHours(1)); // Cache for 1 hour
                    cleanupPendingUserAsync(pendingUser); // Use async cleanup to avoid transaction conflicts
                    return new EmailVerificationResponse(true, "Email verified successfully for profile update!", true);
                }
                
                // Create user from pending user (no need to check if user exists - this is a fresh verification)
                return createUserFromPendingUser(pendingUser);
            }
            
            // If not a pending user, check existing users (legacy system)
            Optional<User> userOptional = userRepository.findByEmailVerificationToken(token);
            
            if (userOptional.isEmpty()) {
                return new EmailVerificationResponse(false, "Invalid or expired verification token");
            }
            
            User user = userOptional.get();
            
            // Check if token is expired
            if (user.getEmailVerificationTokenExpiresAt() == null || 
                user.getEmailVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
                return new EmailVerificationResponse(false, "Verification token has expired. Please request a new one.");
            }
            
            // Check if email is already verified
            if (user.getIsEmailVerified()) {
                return new EmailVerificationResponse(true, "Email is already verified", true);
            }
            
            // Mark email as verified
            user.setIsEmailVerified(true);
            
            // Clear verification token
            user.setEmailVerificationToken(null);
            user.setEmailVerificationTokenExpiresAt(null);
            
            // Save user
            userRepository.save(user);
            
            return new EmailVerificationResponse(true, "Email verified successfully!", true);
            
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle duplicate key constraint violation
            if (e.getMessage().contains("duplicate key") || e.getMessage().contains("unique constraint")) {
                return new EmailVerificationResponse(false, "User with this email already exists. Please sign in instead.");
            } else {
                return new EmailVerificationResponse(false, "Database error occurred during account creation: " + e.getMessage());
            }
        } catch (Exception e) {
            return new EmailVerificationResponse(false, "An error occurred during verification: " + e.getMessage());
        }
    }
    
    /**
     * Helper method to create user from pending user in a separate transaction
     */
    @Transactional
    private EmailVerificationResponse createUserFromPendingUser(PendingUser pendingUser) {
        try {
            // Create actual user from pending user
            User user = new User();
            user.setEmail(pendingUser.getEmail());
            user.setPassword(pendingUser.getPassword()); // Already encoded
            user.setFirstName(pendingUser.getFirstName());
            user.setLastName(pendingUser.getLastName());
            user.setIsActive(true);
            user.setIsEmailVerified(true); // Mark as verified
            
            // Set admin status based on admin code or referral token
            boolean isAdmin = (pendingUser.getAdminCode() != null && !pendingUser.getAdminCode().trim().isEmpty()) ||
                             (pendingUser.getReferralToken() != null && !pendingUser.getReferralToken().trim().isEmpty());
            user.setIsAdmin(isAdmin);
            user.setCanCreateExperiences(false);
            user.setCreatedAt(LocalDateTime.now());
            // KYC status is set to NOT_STARTED by default in the entity
            // updatedAt is set automatically by @UpdateTimestamp
            
            // Save the actual user
            userRepository.save(user);
            
            // Mark referral as used if this was a referral registration
            if (pendingUser.getReferralToken() != null && !pendingUser.getReferralToken().trim().isEmpty()) {
                try {
                    adminReferralService.markReferralAsUsed(pendingUser.getReferralToken());
                } catch (Exception e) {
                    System.err.println("Failed to mark referral as used: " + e.getMessage());
                    // Don't fail the registration if referral marking fails
                }
            }
            
            // Remove pending user from temporary storage using async cleanup to avoid transaction conflicts
            cleanupPendingUserAsync(pendingUser);
            
            return new EmailVerificationResponse(true, "Email verified successfully! Your account has been created.", true);
            
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle duplicate key constraint violation
            cleanupPendingUserAsync(pendingUser);
            if (e.getMessage().contains("duplicate key") || e.getMessage().contains("unique constraint")) {
                // User was created between our check and insertion - this is actually success!
                return new EmailVerificationResponse(true, "Email is already verified! You can now sign in to your account.", true);
            } else {
                return new EmailVerificationResponse(false, "Database error occurred during account creation: " + e.getMessage());
            }
        } catch (Exception e) {
            // Handle other exceptions
            cleanupPendingUserAsync(pendingUser);
            return new EmailVerificationResponse(false, "An error occurred during account creation: " + e.getMessage());
        }
    }
    
    /**
     * Helper method to cleanup pending user in a separate transaction
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    private void cleanupPendingUser(PendingUser pendingUser) {
        try {
            // Refresh entity to get the latest state and avoid stale object deletion
            Optional<PendingUser> freshPendingUser = pendingUserRepository.findById(pendingUser.getId());
            if (freshPendingUser.isPresent()) {
                pendingUserRepository.delete(freshPendingUser.get());
            }
            // If the entity doesn't exist, it was already deleted - no action needed
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            // Entity was already modified/deleted by another transaction - this is expected in concurrent scenarios
            System.out.println("Pending user already processed by another transaction, skipping cleanup");
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to cleanup pending user: " + e.getMessage());
        }
    }
    
    /**
     * Helper method to cleanup pending user asynchronously
     */
    private void cleanupPendingUserAsync(PendingUser pendingUser) {
        // Schedule cleanup in a separate thread to avoid transaction conflicts
        new Thread(() -> {
            try {
                Thread.sleep(1000); // Wait a bit for transaction to complete
                cleanupPendingUser(pendingUser);
            } catch (Exception e) {
                System.err.println("Failed to cleanup pending user asynchronously: " + e.getMessage());
            }
        }).start();
    }
    
    /**
     * Resend verification email for the given email address.
     * 
     * @param email The email address to resend verification to
     * @return EmailVerificationResponse with success status and message
     */
    public EmailVerificationResponse resendVerificationEmail(String email) {
        // This method is essentially the same as generateAndSendVerificationToken
        // but we keep it separate for clarity and potential future differences
        return generateAndSendVerificationToken(email);
    }
    
    /**
     * Check if a user's email is verified or if it's a verified profile update email.
     * 
     * @param email The email address to check
     * @return true if email is verified, false otherwise
     */
    public boolean isEmailVerified(String email) {
        try {
            // First check if this email belongs to an existing verified user
            Optional<User> userOptional = userRepository.findByEmailAndIsActive(email, true);
            if (userOptional.isPresent() && userOptional.get().getIsEmailVerified()) {
                return true;
            }
            
            // Check if this email was recently verified for a profile update
            LocalDateTime expiryTime = verifiedProfileEmails.get(email);
            if (expiryTime != null && expiryTime.isAfter(LocalDateTime.now())) {
                return true;
            } else if (expiryTime != null) {
                // Clean up expired entry
                verifiedProfileEmails.remove(email);
            }
            
            return false;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Clear verified profile email from cache (called after successful profile update).
     * 
     * @param email The email to clear from verification cache
     */
    public void clearVerifiedProfileEmail(String email) {
        verifiedProfileEmails.remove(email);
    }

    /**
     * Clear expired email verification tokens.
     * This method can be called periodically to clean up expired tokens.
     */
    public void clearExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        userRepository.findByEmailVerificationTokenExpiresAtBefore(now)
            .forEach(user -> {
                user.setEmailVerificationToken(null);
                user.setEmailVerificationTokenExpiresAt(null);
                userRepository.save(user);
            });
    }
    
    /**
     * Cancel pending user registration (e.g., when user clicks "Back to Home").
     * This removes the pending user from temporary storage.
     * 
     * @param email The email of the pending user to cancel
     * @return true if pending user was found and removed, false otherwise
     */
    @Transactional
    public boolean cancelPendingRegistration(String email) {
        try {
            if (pendingUserRepository.existsByEmail(email)) {
                pendingUserRepository.deleteByEmail(email);
                System.out.println("Cancelled pending registration for email: " + email);
                return true;
            }
            System.out.println("No pending registration found for email: " + email);
            return false;
        } catch (Exception e) {
            System.err.println("Error canceling pending registration: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Clean up all expired pending users.
     * This method can be called periodically to clean up expired pending registrations.
     */
    public void cleanupExpiredPendingUsers() {
        try {
            pendingUserRepository.deleteExpiredPendingUsers(LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Error cleaning up expired pending users: " + e.getMessage());
        }
    }
}
