package com.backend.service;

import com.backend.entity.User;
import com.backend.entity.KycStatus;
import com.backend.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Collection;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void testLoadUserByUsername_ValidActiveUser_ReturnsUserDetails() {
        // Arrange
        User user = createTestUser("john@example.com", "password", "John", "Doe");
        user.setIsActive(true);
        user.setIsEmailVerified(true);
        user.setCanCreateExperiences(false);
        user.setIsAdmin(false);
        user.setKycStatus(KycStatus.NOT_STARTED);

        when(userRepository.findByEmailAndIsActive("john@example.com", true))
            .thenReturn(Optional.of(user));

        // Act
        UserDetails result = customUserDetailsService.loadUserByUsername("john@example.com");

        // Assert
        assertNotNull(result);
        assertEquals("john@example.com", result.getUsername());
        assertEquals("password", result.getPassword());
        assertTrue(result.isEnabled());
        assertTrue(result.isAccountNonExpired());
        assertTrue(result.isAccountNonLocked());
        assertTrue(result.isCredentialsNonExpired());
        
        // Should have ROLE_TRAVELER by default
        assertTrue(result.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_TRAVELER")));
        assertFalse(result.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_GUIDE")));
        assertFalse(result.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")));

        verify(userRepository).findByEmailAndIsActive("john@example.com", true);
    }

    @Test
    void testLoadUserByUsername_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findByEmailAndIsActive("nonexistent@example.com", true))
            .thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, 
            () -> customUserDetailsService.loadUserByUsername("nonexistent@example.com"));
        assertEquals("User not found with email: nonexistent@example.com", exception.getMessage());

        verify(userRepository).findByEmailAndIsActive("nonexistent@example.com", true);
    }

    @Test
    void testLoadUserByUsername_ApprovedGuide_ReturnsGuideRole() {
        // Arrange
        User user = createTestUser("guide@example.com", "password", "Guide", "User");
        user.setIsActive(true);
        user.setCanCreateExperiences(true);
        user.setKycStatus(KycStatus.APPROVED);
        user.setIsAdmin(false);

        when(userRepository.findByEmailAndIsActive("guide@example.com", true))
            .thenReturn(Optional.of(user));

        // Act
        UserDetails result = customUserDetailsService.loadUserByUsername("guide@example.com");

        // Assert
        assertNotNull(result);
        Collection<? extends GrantedAuthority> authorities = result.getAuthorities();
        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_TRAVELER")));
        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_GUIDE")));
        assertFalse(authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    void testLoadUserByUsername_AdminUser_ReturnsAdminRole() {
        // Arrange
        User user = createTestUser("admin@example.com", "password", "Admin", "User");
        user.setIsActive(true);
        user.setIsAdmin(true);
        user.setCanCreateExperiences(false);
        user.setKycStatus(KycStatus.NOT_STARTED);

        when(userRepository.findByEmailAndIsActive("admin@example.com", true))
            .thenReturn(Optional.of(user));

        // Act
        UserDetails result = customUserDetailsService.loadUserByUsername("admin@example.com");

        // Assert
        assertNotNull(result);
        Collection<? extends GrantedAuthority> authorities = result.getAuthorities();
        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_TRAVELER")));
        assertFalse(authorities.contains(new SimpleGrantedAuthority("ROLE_GUIDE")));
        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    void testCanPerformAction_BookExperienceWithVerifiedUser_ReturnsTrue() {
        // Arrange
        User user = createTestUser("user@example.com", "password", "Test", "User");
        user.setIsActive(true);
        user.setIsEmailVerified(true);

        // Act
        boolean result = customUserDetailsService.canPerformAction(user, "book_experience");

        // Assert
        assertTrue(result);
    }

    @Test
    void testCanPerformAction_CreateExperienceWithoutApprovedKyc_ReturnsFalse() {
        // Arrange
        User user = createTestUser("user@example.com", "password", "Test", "User");
        user.setIsActive(true);
        user.setCanCreateExperiences(true);
        user.setKycStatus(KycStatus.PENDING); // Not approved

        // Act
        boolean result = customUserDetailsService.canPerformAction(user, "create_experience");

        // Assert
        assertFalse(result);
    }

    @Test
    void testCanPerformAction_CreateExperienceWithApprovedKyc_ReturnsTrue() {
        // Arrange
        User user = createTestUser("guide@example.com", "password", "Guide", "User");
        user.setIsActive(true);
        user.setCanCreateExperiences(true);
        user.setKycStatus(KycStatus.APPROVED);

        // Act
        boolean result = customUserDetailsService.canPerformAction(user, "create_experience");

        // Assert
        assertTrue(result);
    }

    // Helper method to create test users
    private User createTestUser(String email, String password, String firstName, String lastName) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(password);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setIsActive(true);
        user.setIsEmailVerified(true);
        user.setCanCreateExperiences(false);
        user.setIsAdmin(false);
        user.setKycStatus(KycStatus.NOT_STARTED);
        return user;
    }
}