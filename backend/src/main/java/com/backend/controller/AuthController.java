package com.backend.controller;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*; 

/**
 * REST Controller for handling authentication requests.
 * Provides endpoints for user login and registration.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"})
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    /**
     * Endpoint for user login.
     * Validates user credentials and returns JWT token if successful.
     * 
     * @param loginRequest The login credentials (email and password)
     * @return ResponseEntity containing AuthResponse with JWT token and user info
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse authResponse = authService.login(loginRequest);
            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid credentials: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint for user registration.
     * Creates a new user account and returns JWT token if successful.
     * 
     * @param registerRequest The registration data (username, email, password, role)
     * @return ResponseEntity containing AuthResponse with JWT token and user info
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse authResponse = authService.register(registerRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Registration failed: " + e.getMessage());
        }
    }
    
    /**
     * Health check endpoint for authentication service.
     * 
     * @return Simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Authentication service is running");
    }
}
