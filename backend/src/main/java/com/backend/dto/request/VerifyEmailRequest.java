package com.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for email verification with token
 * Used when user verifies their email using the verification token
 */
public class VerifyEmailRequest {
    
    @NotBlank(message = "Verification token is required")
    private String token;

    public String getToken() { 
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
