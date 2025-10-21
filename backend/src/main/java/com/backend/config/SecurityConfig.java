package com.backend.config;

import com.backend.security.JwtAuthenticationEntryPoint;
import com.backend.security.JwtAuthenticationFilter;
import com.backend.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; 

import java.util.Arrays;

/**
 * Security configuration for the Trippy application.
 * This class configures Spring Security with JWT authentication, CORS, and role-based access control.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint; // handles unauthorized access attempts and returns appropriate error responses

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter; // intercepts incoming requests and validates JWT tokens

    /**
     * Password encoder bean for hashing passwords.
     * Uses BCrypt algorithm for secure password hashing.
     * 
     * @return BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication provider bean for user authentication.
     * Configures how Spring Security authenticates users using our custom user details service.
     * 
     * @return DaoAuthenticationProvider instance
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setPasswordEncoder(passwordEncoder());
        authProvider.setUserDetailsService(customUserDetailsService);
        return authProvider;
    } 

    /**
     * Authentication manager bean for handling authentication requests.
     * 
     * @param authConfig Authentication configuration
     * @return AuthenticationManager instance
     * @throws Exception if configuration fails
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * CORS configuration source for handling cross-origin requests.
     * Allows requests from the frontend application.
     * 
     * @return CorsConfigurationSource instance
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow requests from frontend (React app)
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"));
        
        // Allow common HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allow common headers
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);
        
        // Apply CORS configuration to all endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    /**
     * Main security filter chain configuration.
     * Defines authentication, authorization, and security rules for the application.
     * 
     * @param http HttpSecurity configuration
     * @return SecurityFilterChain instance
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for JWT-based authentication
            .csrf(AbstractHttpConfigurer::disable)
            
            // Configure CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Configure session management (stateless for JWT)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Configure exception handling
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
            )
            
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no authentication required)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/email-verification/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/users/profile-pictures/**").permitAll()
                .requestMatchers("/api/experience-media/files/**").permitAll()
                .requestMatchers("/api/kyc/documents/**").permitAll() // Allow KYC document access
                .requestMatchers("/api/locations/**").permitAll() // Allow location search for forms
                .requestMatchers("/api/support/**").permitAll() // Public support endpoints
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/travel-articles/upload-image").permitAll() // Allow blog image uploads
                .requestMatchers("/api/travel-articles/images/**").permitAll() // Allow blog image access
                
                // WebSocket endpoints (no authentication required for connection)
                .requestMatchers("/ws/**").permitAll()
                
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // Guide endpoints (requires GUIDE role)
                .requestMatchers("/api/experiences/create").hasRole("GUIDE")
                .requestMatchers("/api/experiences/*/manage").hasRole("GUIDE")
                .requestMatchers("/api/earnings/**").hasRole("GUIDE")
                .requestMatchers("/api/kyc/submit").hasAnyRole("TRAVELER", "GUIDE")
                
                // Traveler endpoints (requires TRAVELER role)
                .requestMatchers("/api/experiences/book").hasRole("TRAVELER")
                .requestMatchers("/api/bookings/**").hasRole("TRAVELER")
                
                // General authenticated endpoints
                .requestMatchers("/api/notifications/**").hasAnyRole("TRAVELER", "GUIDE", "ADMIN") // Allow all authenticated users to access notifications
                .requestMatchers("/api/user/**").hasAnyRole("TRAVELER", "GUIDE", "ADMIN")
                .requestMatchers("/api/users/**").hasAnyRole("TRAVELER", "GUIDE", "ADMIN")
                .requestMatchers("/api/experiences/**").hasAnyRole("TRAVELER", "GUIDE", "ADMIN")
                .requestMatchers("/api/travel-articles/**").hasAnyRole("TRAVELER", "GUIDE", "ADMIN") // Allow all users to create/manage blogs
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            
            // Add JWT authentication filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
