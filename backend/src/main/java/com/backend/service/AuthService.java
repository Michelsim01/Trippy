package com.backend.service;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.entity.User;
import com.backend.repository.UserRepository;
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
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
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
                roles
            );
            
        } catch (Exception e) {
            throw new Exception("Invalid credentials: " + e.getMessage());
        }
    }
    
    /**
     * Register a new user and generate JWT token.
     * 
     * @param registerRequest The registration data
     * @return AuthResponse containing JWT token and user information
     * @throws Exception if registration fails
     */
    public AuthResponse register(RegisterRequest registerRequest) throws Exception {
        try {
            // Check if user already exists
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                throw new Exception("User with email " + registerRequest.getEmail() + " already exists");
            }
            
            // Create new user
            User user = new User();
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            user.setIsActive(true);
            user.setIsEmailVerified(false);
            user.setIsAdmin(false);
            user.setCanCreateExperiences(false);
            user.setCreatedAt(LocalDateTime.now());
            
            // Set role-based permissions
            String role = registerRequest.getRole().toUpperCase();
            switch (role) {
                case "ADMIN":
                    user.setIsAdmin(true);
                    user.setCanCreateExperiences(true);
                    break;
                case "GUIDE":
                    user.setCanCreateExperiences(true);
                    break;
                case "TRAVELER":
                default:
                    // Default permissions for traveler
                    break;
            }
            
            // Save user to database
            User savedUser = userRepository.save(user);
            
            // Generate JWT token
            String token = jwtUtil.generateToken(org.springframework.security.core.userdetails.User.builder()
                .username(savedUser.getEmail())
                .password("")
                .authorities("ROLE_" + role)
                .build());
            
            // Create roles list
            List<String> roles = List.of("ROLE_" + role);
            
            // Create and return response
            return new AuthResponse(
                token,
                "Bearer",
                savedUser.getFirstName() + " " + savedUser.getLastName(),
                savedUser.getEmail(),
                roles
            );
            
        } catch (Exception e) {
            throw new Exception("Registration failed: " + e.getMessage());
        }
    }
}
