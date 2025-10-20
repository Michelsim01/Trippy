package com.backend.controller;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.dto.response.RegistrationResponse;
import com.backend.entity.User;
import com.backend.repository.UserRepository;
import com.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional; 

/**
 * REST Controller for handling authentication requests.
 * Provides endpoints for user login and registration.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserRepository userRepository;
    
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
            // Check if user exists first
            Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("No account found with this email address. Please check your email or create a new account.");
            }
            
            User user = userOptional.get();
            if (user.getIsActive() == null || !user.getIsActive()) {
                // User exists but is suspended - return specific error for frontend to handle
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "ACCOUNT_SUSPENDED", "message", "Your account has been suspended. Please contact support to appeal."));
            }
            
            AuthResponse authResponse = authService.login(loginRequest);
            return ResponseEntity.ok(authResponse);
        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Incorrect password. Please try again.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed. Please try again.");
        }
    }
    
    /**
     * Endpoint for user registration.
     * Creates a pending user account and sends verification email.
     * 
     * @param registerRequest The registration data (username, email, password, role)
     * @return ResponseEntity containing RegistrationResponse with success status and message
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            RegistrationResponse registrationResponse = authService.register(registerRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(registrationResponse);
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
