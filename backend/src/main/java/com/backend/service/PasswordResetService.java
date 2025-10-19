package com.backend.service;

import com.backend.entity.User;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for handling password reset functionality.
 * Manages password reset token generation, validation, and password updates.
 */
@Service
public class PasswordResetService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailService emailService;
    
    // Token expiration time: 1 hour
    private static final int TOKEN_EXPIRATION_HOURS = 1;
    
    /**
     * Generate a password reset token for the given email.
     * 
     * @param email The email address to generate reset token for
     * @return The generated reset token
     * @throws Exception if user not found
     */
    public String generatePasswordResetToken(String email) throws Exception {
        // Find user by email
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            throw new Exception("User not found with email: " + email);
        }
        
        User user = userOptional.get();  
        
        // Generate a unique reset token
        String resetToken = UUID.randomUUID().toString();
        
        // Set token and expiration time
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HOURS));
        
        // Save user with reset token
        userRepository.save(user);
        
        // Send password reset email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken, user.getFirstName(), user.getIsAdmin());
        } catch (Exception e) {
            // Log the error but don't fail the token generation
            System.err.println("Failed to send password reset email: " + e.getMessage());
        }
        
        return resetToken;
    }
    
    /**
     * Validate a password reset token.
     * 
     * @param token The reset token to validate
     * @return true if token is valid, false otherwise
     */
    public boolean validatePasswordResetToken(String token) { 
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        
        // Find user by reset token
        Optional<User> userOptional = userRepository.findByPasswordResetToken(token);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        
        // Check if token is expired
        if (user.getPasswordResetTokenExpiresAt() == null || 
            user.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Reset password using a valid reset token.
     * 
     * @param token The reset token
     * @param newPassword The new password
     * @throws Exception if token is invalid or expired
     */
    public void resetPassword(String token, String newPassword) throws Exception {
        // Validate token
        if (!validatePasswordResetToken(token)) {
            throw new Exception("Invalid or expired reset token");
        }
        
        // Find user by reset token
        Optional<User> userOptional = userRepository.findByPasswordResetToken(token);
        
        if (userOptional.isEmpty()) {
            throw new Exception("Invalid reset token");
        }
        
        User user = userOptional.get();
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        
        // Clear reset token
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        
        // Save user
        userRepository.save(user);
        
        // Send password changed confirmation email
        try {
            emailService.sendPasswordChangedConfirmation(user.getEmail(), user.getFirstName());
        } catch (Exception e) {
            // Log the error but don't fail the password reset
            System.err.println("Failed to send password changed confirmation email: " + e.getMessage());
        }
    }
    
    /**
     * Clear expired password reset tokens.
     * This method can be called periodically to clean up expired tokens.
     */
    public void clearExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        userRepository.findByPasswordResetTokenExpiresAtBefore(now)
            .forEach(user -> {
                user.setPasswordResetToken(null);
                user.setPasswordResetTokenExpiresAt(null);
                userRepository.save(user);
            });
    }
}
