package com.backend.controller;

import com.backend.dto.request.EmailVerificationRequest;
import com.backend.dto.request.VerifyEmailRequest;
import com.backend.dto.response.EmailVerificationResponse;
import com.backend.service.EmailVerificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling email verification endpoints.
 * Provides REST API for sending verification emails, verifying emails, and resending verification.
 */
@RestController
@RequestMapping("/api/email-verification")
@CrossOrigin(origins = "http://localhost:5173")
public class EmailVerificationController {

    @Autowired
    private EmailVerificationService emailVerificationService;

    /**
     * Send email verification email to user
     * POST /api/auth/send-verification
     * 
     * @param request EmailVerificationRequest containing email address
     * @return EmailVerificationResponse with success status and message
     */
    @PostMapping("/send-verification") 
    public ResponseEntity<EmailVerificationResponse> sendVerificationEmail(
            @Valid @RequestBody EmailVerificationRequest request) {
        
        try {
            EmailVerificationResponse response = emailVerificationService
                .generateAndSendVerificationToken(request.getEmail());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            EmailVerificationResponse errorResponse = new EmailVerificationResponse(
                false, 
                "An error occurred while sending verification email: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Verify email address using verification token
     * POST /api/auth/verify-email
     * 
     * @param request VerifyEmailRequest containing verification token
     * @return EmailVerificationResponse with verification status
     */
    @PostMapping("/verify-email")
    public ResponseEntity<EmailVerificationResponse> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        
        try {
            EmailVerificationResponse response = emailVerificationService
                .verifyEmail(request.getToken());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            EmailVerificationResponse errorResponse = new EmailVerificationResponse(
                false, 
                "An error occurred during email verification: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Resend verification email to user
     * POST /api/auth/resend-verification
     * 
     * @param request EmailVerificationRequest containing email address
     * @return EmailVerificationResponse with success status and message
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<EmailVerificationResponse> resendVerificationEmail(
            @Valid @RequestBody EmailVerificationRequest request) {
        
        try {
            EmailVerificationResponse response = emailVerificationService
                .resendVerificationEmail(request.getEmail());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            EmailVerificationResponse errorResponse = new EmailVerificationResponse(
                false, 
                "An error occurred while resending verification email: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Check if user's email is verified
     * GET /api/auth/check-verification?email={email}
     * 
     * @param email User's email address
     * @return EmailVerificationResponse with verification status
     */
    @GetMapping("/check-verification")
    public ResponseEntity<EmailVerificationResponse> checkEmailVerification(
            @RequestParam String email) {
        
        try {
            boolean isVerified = emailVerificationService.isEmailVerified(email);
            
            EmailVerificationResponse response = new EmailVerificationResponse(
                true, 
                isVerified ? "Email is verified" : "Email is not verified",
                isVerified
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            EmailVerificationResponse errorResponse = new EmailVerificationResponse(
                false, 
                "An error occurred while checking verification status: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Cancel pending user registration.
     * This endpoint is called when a user decides to go back to home
     * without verifying their email, effectively canceling their registration.
     * 
     * @param email The email of the pending registration to cancel
     * @return ResponseEntity with success status
     */
    @PostMapping("/cancel-pending")
    public ResponseEntity<EmailVerificationResponse> cancelPendingRegistration(@RequestParam String email) {
        try {
            boolean cancelled = emailVerificationService.cancelPendingRegistration(email);
            
            if (cancelled) {
                EmailVerificationResponse response = new EmailVerificationResponse(
                    true, 
                    "Pending registration cancelled successfully"
                );
                return ResponseEntity.ok(response);
            } else {
                EmailVerificationResponse response = new EmailVerificationResponse(
                    false, 
                    "No pending registration found for this email"
                );
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            EmailVerificationResponse errorResponse = new EmailVerificationResponse(
                false, 
                "An error occurred while canceling registration: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
