package com.backend.controller;

import com.backend.service.AdminReferralService;
import com.backend.entity.AdminReferral;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Public controller for referral validation during signup.
 * This endpoint needs to be accessible without authentication.
 */
@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PublicReferralController {
    
    @Autowired
    private AdminReferralService adminReferralService;
    
    /**
     * Validate a referral token (used during signup) - PUBLIC ENDPOINT
     */
    @GetMapping("/referrals/validate/{token}")
    public ResponseEntity<Map<String, Object>> validateReferralToken(@PathVariable String token) {
        try {
            AdminReferral referral = adminReferralService.validateReferralToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("referredEmail", referral.getReferredEmail());
            response.put("referrerName", referral.getReferrerName());
            response.put("expiresAt", referral.getExpiresAt());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
