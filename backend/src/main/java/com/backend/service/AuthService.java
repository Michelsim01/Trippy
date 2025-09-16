package com.backend.service;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.entity.User;
import com.backend.entity.PendingUser;
import com.backend.repository.UserRepository;
import com.backend.repository.PendingUserRepository;
import com.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for handling authentication operations.
 * Manages user login, registration, and JWT token generation.
 */
@Service
@Transactional
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;  
    
    @Autowired
    private PendingUserRepository pendingUserRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private EmailVerificationService emailVerificationService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    /**
     * Authenticate user and generate JWT token.
     * 
     * @param loginRequest The login credentials
     * @return AuthResponse containing JWT token and user information
     * @throws Exception if authentication fails
     */
    public AuthResponse login(LoginRequest loginRequest) throws Exception {
        try {
            // Authenticate user using Spring Security
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );
            
            // Get user details from authentication
            User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new Exception("User not found"));
            
            // Update last login time
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
            
            // Generate JWT token
            String token = jwtUtil.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
            
            // Extract user roles
            List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
            
            // Create and return response
            return new AuthResponse(
                token,
                "Bearer",
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                roles,
                user.getIsEmailVerified(),
                user.getId()
            );
            
        } catch (Exception e) {
            throw e; // Re-throw the original exception
        }
    }
    
    /**
     * Register a new user temporarily until email verification.
     * Creates a pending user record and sends verification email.
     * 
     * @param registerRequest The registration data
     * @return AuthResponse containing JWT token and user information
     * @throws Exception if registration fails
     */
    public AuthResponse register(RegisterRequest registerRequest) throws Exception {
        try {
            // Check if user already exists in main user table
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                throw new Exception("User with email " + registerRequest.getEmail() + " already exists");
            }
            
            // Check if there's already a pending registration for this email
            if (pendingUserRepository.existsByEmail(registerRequest.getEmail())) {
                // Remove the existing pending registration
                pendingUserRepository.deleteByEmail(registerRequest.getEmail());
            }
            
            // Generate verification token
            String verificationToken = emailVerificationService.generateVerificationToken();
            
            // Create pending user (not saved to main user table yet)
            PendingUser pendingUser = new PendingUser(
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getFirstName(),
                registerRequest.getLastName(),
                verificationToken
            );
            
            // Save pending user to temporary storage
            PendingUser savedPendingUser = pendingUserRepository.save(pendingUser);
            
            // Send email verification email with the token
            try {
                emailVerificationService.sendVerificationEmail(savedPendingUser.getEmail(), verificationToken);
                System.out.println("Verification email sent to: " + savedPendingUser.getEmail());
            } catch (Exception e) {
                // If email sending fails, remove the pending user and fail registration
                pendingUserRepository.delete(savedPendingUser);
                throw new Exception("Failed to send verification email. Please try again.");
            }
            
            // Generate JWT token for the pending user (with limited access)
            String token = jwtUtil.generateToken(org.springframework.security.core.userdetails.User.builder()
                .username(savedPendingUser.getEmail())
                .password("")
                .authorities("ROLE_PENDING")
                .build());
            
            // Create roles list for pending user
            List<String> roles = List.of("ROLE_PENDING");
            
            // Create and return response (emailVerified = false since it's pending)
            return new AuthResponse(
                token,
                "Bearer",
                savedPendingUser.getFirstName() + " " + savedPendingUser.getLastName(),
                savedPendingUser.getEmail(),
                roles,
                false, // Email is not verified yet
                null   // No user ID yet for pending users
            );
            
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }
}
