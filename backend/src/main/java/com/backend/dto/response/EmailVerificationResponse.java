package com.backend.dto.response;

/**
 * DTO for email verification responses
 * Used to return verification status and messages
 */
public class EmailVerificationResponse {
    
    private boolean success;
    private String message;
    private boolean emailVerified;

    public EmailVerificationResponse() {} 

    public EmailVerificationResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public EmailVerificationResponse(boolean success, String message, boolean emailVerified) {
        this.success = success;
        this.message = message;
        this.emailVerified = emailVerified;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
}
