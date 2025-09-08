package com.backend.service;

import com.backend.entity.User;
import com.backend.entity.UserCapability;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Custom UserDetailsService implementation for Spring Security integration.
 * This service loads user details from the database and converts them to Spring Security's UserDetails format.
 * It supports the dual-role system where users can be both travelers and guides.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Main method: Load user details by username (email) for authentication.
     * This method is called by Spring Security during the authentication process.
     * 
     * @param email The email address of the user to load
     * @return UserDetails object containing user information and authorities
     * @throws UsernameNotFoundException if user is not found or inactive
     */
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Find user by email
        Optional<User> userOptional = userRepository.findByEmailAndIsActive(email, true);
        
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        
        User user = userOptional.get();
        
        // Check if user is active
        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + email);
        }
        
        // Build authorities based on user capabilities
        // This method determines what roles/permissions a user has based on their status.
        Collection<? extends GrantedAuthority> authorities = getUserAuthorities(user);
        
        // Create and return UserDetails object
        // Convert to Spring Security's UserDetails format
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword()) // password is hashed and stored in the database
                .authorities(authorities) // authorities are the roles/permissions a user has
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }
    
    /**
     * Load user details by user ID.
     * This method can be used when you have the user ID instead of email.
     * 
     * @param userId The ID of the user to load
     * @return UserDetails object containing user information and authorities
     * @throws UsernameNotFoundException if user is not found or inactive
     */
    @Transactional
    public UserDetails loadUserById(Long userId) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with ID: " + userId);
        }
        
        User user = userOptional.get();
        
        // Check if user is active
        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + user.getEmail());
        }
        
        // Build authorities based on user capabilities
        Collection<? extends GrantedAuthority> authorities = getUserAuthorities(user);
        
        // Create and return UserDetails object
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }
    
    /**
     * Get user capabilities and convert them to Spring Security authorities.
     * This method determines what roles/permissions a user has based on their status.
     * 
     * @param user The user entity
     * @return Collection of GrantedAuthority objects representing user capabilities
     */
    private Collection<? extends GrantedAuthority> getUserAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // Every user is a traveler by default
        authorities.add(new SimpleGrantedAuthority("ROLE_TRAVELER"));
        
        // Check if user can create experiences (guide capability)
        // Set user as guide if they can create experiences and have approved KYC
        if (user.getCanCreateExperiences() && user.getKycStatus().name().equals("APPROVED")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_GUIDE"));
        }
        
        // Check if user is admin
        // Set user as admin if they are an admin
        if (user.getIsAdmin()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        
        // Note: We only use the UserCapability enum values for roles
        // Additional permissions can be checked in business logic if needed
        
        return authorities;
    }
    
    /**
     * Check if a user has a specific capability.
     * This method can be used to check user permissions in business logic.
     * 
     * @param user The user entity
     * @param capability The capability to check
     * @return true if user has the capability, false otherwise
     */
    public boolean hasCapability(User user, UserCapability capability) {
        switch (capability) {
            case TRAVELER:
                return true; // Every user is a traveler
            case GUIDE:
                return user.getCanCreateExperiences() && 
                       user.getKycStatus().name().equals("APPROVED");
            case ADMIN:
                return user.getIsAdmin();
            default:
                return false;
        }
    }
    
    /**
     * Get user capabilities as a list of UserCapability enums.
     * This method returns the actual capabilities a user has.
     * 
     * @param user The user entity
     * @return List of UserCapability enums
     */
    public List<UserCapability> getUserCapabilitiesList(User user) {
        List<UserCapability> capabilities = new ArrayList<>();
        
        // Every user is a traveler
        capabilities.add(UserCapability.TRAVELER);
        
        // Check guide capability
        if (user.getCanCreateExperiences() && user.getKycStatus().name().equals("APPROVED")) {
            capabilities.add(UserCapability.GUIDE);
        }
        
        // Check admin capability
        if (user.getIsAdmin()) {
            capabilities.add(UserCapability.ADMIN);
        }
        
        return capabilities;
    }
    
    /**
     * Check if a user can perform a specific action.
     * This method provides a centralized way to check user permissions.
     * 
     * @param user The user entity
     * @param action The action to check
     * @return true if user can perform the action, false otherwise
     */
    public boolean canPerformAction(User user, String action) {
        switch (action.toLowerCase()) {
            case "book_experience":
                return user.getIsActive() && user.getIsEmailVerified();
            case "create_experience":
                return user.getIsActive() && 
                       user.getCanCreateExperiences() && 
                       user.getKycStatus().name().equals("APPROVED");
            case "manage_experience":
                return user.getIsActive() && 
                       user.getCanCreateExperiences() && 
                       user.getKycStatus().name().equals("APPROVED");
            case "admin_access":
                return user.getIsActive() && user.getIsAdmin();
            case "kyc_submission":
                return user.getIsActive() && 
                       !user.getKycStatus().name().equals("PENDING") &&
                       !user.getKycStatus().name().equals("APPROVED");
            default:
                return false;
        }
    }
}
