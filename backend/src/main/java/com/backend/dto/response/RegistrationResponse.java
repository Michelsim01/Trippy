package com.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for registration responses.
 * Contains simple success message and email for verification flow.
 */
public class RegistrationResponse {
    
    private boolean success;
    private String message;
    private String email;
    
    // Default constructor
    public RegistrationResponse() {}
    
    // Constructor with parameters
    public RegistrationResponse(boolean success, String message, String email) {
        this.success = success;
        this.message = message;
        this.email = email;
    }
    
    // Getters and setters
    @JsonProperty("success")
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    @JsonProperty("message")
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    @JsonProperty("email")
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    @Override
    public String toString() {
        return "RegistrationResponse{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
