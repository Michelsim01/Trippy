package com.backend.service;

import com.backend.dto.request.LoginRequest;
import com.backend.dto.request.RegisterRequest;
import com.backend.dto.response.AuthResponse;
import com.backend.dto.response.RegistrationResponse;
import com.backend.entity.User;
import com.backend.entity.PendingUser;
import com.backend.repository.UserRepository;
import com.backend.repository.PendingUserRepository;
import com.backend.util.JwtUtil;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PendingUserRepository pendingUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private JwtUtil jwtUtil;
    
    @Mock
    private EmailVerificationService emailVerificationService;
    
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    void testRegister_SuccessfulRegistration_ReturnsSuccessResponse() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");
        request.setFirstName("John");
        request.setLastName("Doe");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(pendingUserRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(emailVerificationService.generateVerificationToken()).thenReturn("verification-token");

        PendingUser savedPendingUser = new PendingUser("test@example.com", "encodedPassword", 
                                                      "John", "Doe", "verification-token");
        when(pendingUserRepository.save(any(PendingUser.class))).thenReturn(savedPendingUser);

        // Act
        RegistrationResponse result = authService.register(request);

        // Assert
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("Registration successful! Please check your email to verify your account.", result.getMessage());
        assertEquals("test@example.com", result.getEmail());

        verify(userRepository).existsByEmail("test@example.com");
        verify(pendingUserRepository).existsByEmail("test@example.com");
        verify(passwordEncoder).encode("password");
        verify(pendingUserRepository).save(any(PendingUser.class));
        verify(emailVerificationService).sendVerificationEmail("test@example.com", "verification-token");
    }
    
    @Test
    void testRegister_EmailAlreadyExists_ThrowsException() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act & Assert
        Exception exception = assertThrows(Exception.class, () -> authService.register(request));
        assertEquals("User with email test@example.com already exists", exception.getMessage());

        verify(userRepository).existsByEmail("test@example.com");
        verify(pendingUserRepository, never()).save(any(PendingUser.class));
    }

    @Test
    void testRegister_EmailSendingFails_ThrowsException() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");
        request.setFirstName("John");
        request.setLastName("Doe");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(pendingUserRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(emailVerificationService.generateVerificationToken()).thenReturn("verification-token");

        PendingUser savedPendingUser = new PendingUser("test@example.com", "encodedPassword", 
                                                      "John", "Doe", "verification-token");
        when(pendingUserRepository.save(any(PendingUser.class))).thenReturn(savedPendingUser);
        doThrow(new RuntimeException("Email service unavailable"))
            .when(emailVerificationService).sendVerificationEmail(anyString(), anyString());

        // Act & Assert
        Exception exception = assertThrows(Exception.class, () -> authService.register(request));
        assertEquals("Failed to send verification email. Please try again.", exception.getMessage());

        verify(pendingUserRepository).delete(savedPendingUser);
    }

    @Test
    void testLogin_CorrectCredentials_ReturnsAuthResponse() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setIsEmailVerified(true);

        UserDetails userDetails = mock(UserDetails.class);
        Authentication authentication = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authentication.getAuthorities()).thenAnswer(invocation -> List.of(new SimpleGrantedAuthority("ROLE_USER")));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(userDetails)).thenReturn("jwt-token");

        // Act
        AuthResponse result = authService.login(request);

        // Assert
        assertNotNull(result);
        assertEquals("jwt-token", result.getToken());
        assertEquals("Bearer", result.getType());
        assertEquals("John Doe", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        assertEquals(List.of("ROLE_USER"), result.getRoles());
        assertTrue(result.isEmailVerified());
        assertEquals(1L, result.getUserId());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail("test@example.com");
        verify(userRepository).save(user); // Verify last login time was updated
        verify(jwtUtil).generateToken(userDetails);
    }

    @Test
    void testLogin_InvalidCredentials_ThrowsException() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("wrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenThrow(new RuntimeException("Authentication failed"));

        // Act & Assert
        Exception exception = assertThrows(Exception.class, () -> authService.login(request));
        assertEquals("Authentication failed", exception.getMessage());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void testLogin_UserNotFoundAfterAuthentication_ThrowsException() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        Authentication authentication = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(Exception.class, () -> authService.login(request));
        assertEquals("User not found", exception.getMessage());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail("test@example.com");
    }
}
