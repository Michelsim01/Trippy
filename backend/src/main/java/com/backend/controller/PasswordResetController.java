package com.backend.controller;

import com.backend.dto.request.ForgotPasswordRequest;
import com.backend.dto.request.ResetPasswordRequest;
import com.backend.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling password reset functionality.
 * Provides endpoints for forgot password and reset password operations.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"})
public class PasswordResetController {
    
    @Autowired
    private PasswordResetService passwordResetService;
    
    /**
     * Endpoint for forgot password request.
     * Generates a password reset token and sends it via email.
     * 
     * @param request The forgot password request containing email
     * @return ResponseEntity with success message or error
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            // Generate password reset token and send email
            passwordResetService.generatePasswordResetToken(request.getEmail());
            
            return ResponseEntity.ok().body("Password reset instructions have been sent to your email address.");
            
        } catch (Exception e) {
            // Return specific error messages to help users
            if (e.getMessage().contains("User not found")) {
                return ResponseEntity.badRequest().body("No account found with that email address.");
            } else {
                return ResponseEntity.badRequest().body("Failed to send password reset instructions. Please try again.");
            }
        }
    }  
    
    /**
     * Endpoint to validate a password reset token.
     * 
     * @param token The reset token to validate
     * @return ResponseEntity with validation result
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        try {
            boolean isValid = passwordResetService.validatePasswordResetToken(token);
            
            if (isValid) {
                return ResponseEntity.ok().body("Token is valid");
            } else {
                return ResponseEntity.badRequest().body("Invalid or expired token");
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }
    }
    
    /**
     * Endpoint for resetting password with a valid token.
     * 
     * @param request The reset password request containing token and new password
     * @return ResponseEntity with success message
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try { 
            // Reset password using token
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            
            return ResponseEntity.ok().body("Password has been reset successfully");
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid or expired reset token");
        }
    }
    
}
