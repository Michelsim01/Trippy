package com.backend.dto.response;

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
    
    // Default constructor
    public AuthResponse() {}
    
    // Constructor with parameters
    public AuthResponse(String token, String type, String username, String email, List<String> roles) {
        this.token = token;
        this.type = type;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public List<String> getRoles() { 
        return roles;
    }
    
    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
    
    @Override
    public String toString() {
        return "AuthResponse{" +
                "token='[PROTECTED]'" +
                ", type='" + type + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", roles=" + roles +
                '}';
    }
}
