package com.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTO for authentication responses.
 * Contains the data sent back to the frontend after successful login or registration.
 */
public class AuthResponse {
    
    private String token;
    private String type;
    private String username;
    private String email;
    private List<String> roles;
    private boolean emailVerified;
    private Long userId;
    
    // Default constructor
    public AuthResponse() {}
    
    // Constructor with parameters
    public AuthResponse(String token, String type, String username, String email, List<String> roles, boolean emailVerified, Long userId) {
        this.token = token;
        this.type = type;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.emailVerified = emailVerified;
        this.userId = userId;
    }
    
    // Getters and setters
    @JsonProperty("token")
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    @JsonProperty("type")
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    @JsonProperty("username")
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    @JsonProperty("email")
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    @JsonProperty("roles")
    public List<String> getRoles() { 
        return roles;
    }
    
    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
    
    @JsonProperty("emailVerified")
    public boolean isEmailVerified() {
        return emailVerified;
    }
    
    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
    
    @JsonProperty("userId")
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    @Override
    public String toString() {
        return "AuthResponse{" +
                "token='[PROTECTED]'" +
                ", type='" + type + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", roles=" + roles +
                ", emailVerified=" + emailVerified +
                ", userId=" + userId +
                '}';
    }
}
