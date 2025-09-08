package com.backend.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for handling JWT (JSON Web Token) operations.
 * This class provides methods for creating, validating, and extracting information from JWT tokens.
 */
@Component
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration}")
    private Long expiration;
    
    @Value("${jwt.prefix}")
    private String prefix;
    
    // 1. Core token generation methods

    /**
     * Generate a JWT token for the given user details - for basic use cases like password reset, email verification etc.
     * 
     * @param userDetails The user details to include in the token
     * @return The generated JWT token
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }
    
    /**
     * Generate a JWT token with additional claims - for user authentication during signup/login
     * 
     * @param userDetails The user details to include in the token
     * @param additionalClaims Additional claims to include in the token
     * @return The generated JWT token
     */
    public String generateToken(UserDetails userDetails, Map<String, Object> additionalClaims) {
        return createToken(additionalClaims, userDetails.getUsername());
    }
    
    /**
     * Create a JWT token with the specified claims and subject - for user authentication during signup/login
     * 
     * @param claims The claims to include in the token
     * @param subject The subject (usually username/email) of the token
     * @return The created JWT token
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // 2. Token extraction methods
    
    /**
     * Extract the username (email) from the JWT token.
     * 
     * @param token The JWT token
     * @return The username extracted from the token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Extract the expiration date from the JWT token.
     * 
     * @param token The JWT token
     * @return The expiration date of the token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extract a specific claim from the JWT token.
     * 
     * @param token The JWT token
     * @param claimsResolver Function to extract the specific claim
     * @param <T> The type of the claim
     * @return The extracted claim value
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extract all claims from the JWT token.
     * 
     * @param token The JWT token
     * @return All claims from the token
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 3. Token validation methods
    
    /**
     * Check if the JWT token is expired.
     * 
     * @param token The JWT token
     * @return true if the token is expired, false otherwise
     */
    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * Validate the JWT token against the user details.
     * 
     * @param token The JWT token
     * @param userDetails The user details to validate against
     * @return true if the token is valid, false otherwise
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
    
    /**
     * Validate the JWT token without user details (just check if it's valid and not expired).
     * 
     * @param token The JWT token
     * @return true if the token is valid, false otherwise
     */
    public Boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
    
    // 4. Token security methods

    /**
     * Get the signing key for JWT operations.
     * 
     * @return The secret key used for signing JWT tokens
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(); // converts string to bytes
        return Keys.hmacShaKeyFor(keyBytes); // creates a secret key for HMAC-SHA algorithms (cryptographic key)
    }
    

    // 5. Token utility methods (helper methods)
    /**
     * Get the token prefix (e.g., "Bearer ").
     * 
     * @return The token prefix
     */
    public String getPrefix() {
        return prefix;
    }
    
    /**
     * Get the token expiration time in milliseconds.
     * 
     * @return The token expiration time
     */
    public Long getExpiration() {
        return expiration;
    }
    
    /**
     * Extract the token from the Authorization header.
     * Removes the "Bearer " prefix if present.
     * 
     * @param authHeader The Authorization header value
     * @return The token without the prefix, or null if not found
     */
    public String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith(prefix)) {
            return authHeader.substring(prefix.length());
        }
        return null;
    }
    
    /**
     * Get the time until the token expires in milliseconds.
     * 
     * @param token The JWT token
     * @return The time until expiration in milliseconds, or 0 if expired
     */
    public Long getTimeUntilExpiration(String token) {
        try {
            Date expiration = extractExpiration(token);
            long timeUntilExpiration = expiration.getTime() - System.currentTimeMillis();
            return Math.max(0, timeUntilExpiration);
        } catch (Exception e) {
            return 0L;
        }
    }
    
    /**
     * Check if the token will expire soon (within the specified minutes).
     * 
     * @param token The JWT token
     * @param minutesBeforeExpiration The number of minutes before expiration to consider "soon"
     * @return true if the token expires within the specified time, false otherwise
     */
    public Boolean isTokenExpiringSoon(String token, int minutesBeforeExpiration) {
        try {
            Date expiration = extractExpiration(token);
            long timeUntilExpiration = expiration.getTime() - System.currentTimeMillis();
            long minutesUntilExpiration = timeUntilExpiration / (1000 * 60);
            return minutesUntilExpiration <= minutesBeforeExpiration;
        } catch (Exception e) {
            return true; // Consider expired if we can't parse it
        }
    }
}
