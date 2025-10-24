package com.backend.service;

import com.backend.entity.AdminReferral;
import com.backend.entity.User;
import com.backend.repository.AdminReferralRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing admin referral functionality.
 */
@Service
public class AdminReferralService {
    
    @Autowired
    private AdminReferralRepository adminReferralRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    private static final String TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 32;
    
    /**
     * Create a new admin referral invitation.
     * 
     * @param referredEmail The email address to invite
     * @param referrerId The ID of the admin making the referral
     * @return AdminReferral object if successful
     * @throws Exception if referral creation fails
     */
    @Transactional
    public AdminReferral createReferral(String referredEmail, Long referrerId) throws Exception {
        // Validate referrer exists and is admin
        Optional<User> referrerOpt = userRepository.findById(referrerId);
        if (!referrerOpt.isPresent()) {
            throw new Exception("Referrer not found");
        }
        
        User referrer = referrerOpt.get();
        if (!referrer.getIsAdmin()) {
            throw new Exception("Only admins can make referrals");
        }
        
        // Check if email is already a user
        if (userRepository.existsByEmail(referredEmail)) {
            throw new Exception("An account with this email address already exists");
        }
        
        // Check if there's already an active referral for this email
        List<AdminReferral> existingReferrals = adminReferralRepository.findActiveByReferredEmail(
            referredEmail, LocalDateTime.now());
        if (!existingReferrals.isEmpty()) {
            throw new Exception("A referral invitation has already been sent to this email address");
        }
        
        // Generate unique referral token
        String referralToken = generateReferralToken();
        
        // Create referral record
        AdminReferral referral = new AdminReferral(
            referredEmail,
            referralToken,
            referrerId,
            referrer.getEmail(),
            referrer.getFirstName() + " " + referrer.getLastName()
        );
        
        AdminReferral savedReferral = adminReferralRepository.save(referral);
        
        // Send referral email
        try {
            emailService.sendAdminReferralEmail(
                referredEmail,
                referralToken,
                referrer.getFirstName() + " " + referrer.getLastName()
            );
        } catch (Exception e) {
            // If email fails, delete the referral record
            adminReferralRepository.delete(savedReferral);
            throw new Exception("Failed to send referral email: " + e.getMessage());
        }
        
        return savedReferral;
    }
    
    /**
     * Validate a referral token and get the referral details.
     * 
     * @param referralToken The referral token to validate
     * @return AdminReferral object if valid
     * @throws Exception if token is invalid or expired
     */
    public AdminReferral validateReferralToken(String referralToken) throws Exception {
        Optional<AdminReferral> referralOpt = adminReferralRepository.findActiveByReferralToken(
            referralToken, LocalDateTime.now());
        
        if (!referralOpt.isPresent()) {
            throw new Exception("Invalid or expired referral token");
        }
        
        return referralOpt.get();
    }
    
    /**
     * Mark a referral as used.
     * 
     * @param referralToken The referral token that was used
     * @throws Exception if token is invalid
     */
    @Transactional
    public void markReferralAsUsed(String referralToken) throws Exception {
        Optional<AdminReferral> referralOpt = adminReferralRepository.findByReferralToken(referralToken);
        
        if (!referralOpt.isPresent()) {
            throw new Exception("Referral token not found");
        }
        
        AdminReferral referral = referralOpt.get();
        referral.setIsUsed(true);
        referral.setUsedAt(LocalDateTime.now());
        
        adminReferralRepository.save(referral);
    }
    
    /**
     * Get referrals made by a specific admin.
     * 
     * @param referrerId The ID of the admin
     * @return List of referrals made by the admin
     */
    public List<AdminReferral> getReferralsByReferrer(Long referrerId) {
        return adminReferralRepository.findByReferrerId(referrerId);
    }
    
    /**
     * Get referral statistics for an admin.
     * 
     * @param referrerId The ID of the admin
     * @return Map containing referral statistics
     */
    public java.util.Map<String, Object> getReferralStats(Long referrerId) {
        long totalReferrals = adminReferralRepository.countByReferrerId(referrerId);
        long usedReferrals = adminReferralRepository.countByReferrerIdAndIsUsed(referrerId, true);
        long pendingReferrals = adminReferralRepository.countByReferrerIdAndIsUsed(referrerId, false);
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalReferrals", totalReferrals);
        stats.put("usedReferrals", usedReferrals);
        stats.put("pendingReferrals", pendingReferrals);
        stats.put("successRate", totalReferrals > 0 ? (double) usedReferrals / totalReferrals * 100 : 0.0);
        
        return stats;
    }
    
    /**
     * Clean up expired referrals.
     * This method can be called periodically to clean up expired referrals.
     */
    @Transactional
    public void cleanupExpiredReferrals() {
        List<AdminReferral> expiredReferrals = adminReferralRepository.findExpiredReferrals(LocalDateTime.now());
        adminReferralRepository.deleteAll(expiredReferrals);
    }
    
    /**
     * Generate a unique referral token.
     * 
     * @return A unique referral token
     */
    private String generateReferralToken() {
        SecureRandom random = new SecureRandom();
        StringBuilder token = new StringBuilder(TOKEN_LENGTH);
        
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            token.append(TOKEN_CHARS.charAt(random.nextInt(TOKEN_CHARS.length())));
        }
        
        // Ensure token is unique
        while (adminReferralRepository.findByReferralToken(token.toString()).isPresent()) {
            token = new StringBuilder(TOKEN_LENGTH);
            for (int i = 0; i < TOKEN_LENGTH; i++) {
                token.append(TOKEN_CHARS.charAt(random.nextInt(TOKEN_CHARS.length())));
            }
        }
        
        return token.toString();
    }
}
