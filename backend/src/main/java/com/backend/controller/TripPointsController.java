package com.backend.controller;

import com.backend.entity.TripPoints;
import com.backend.service.TripPointsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-points")
@CrossOrigin(origins = "http://localhost:5173")
public class TripPointsController {
    
    @Autowired
    private TripPointsService tripPointsService;

    /**
     * Get all TripPoints records
     */
    @GetMapping
    public ResponseEntity<List<TripPoints>> getAllTripPoints() {
        List<TripPoints> tripPoints = tripPointsService.getAllTripPoints();
        return ResponseEntity.ok(tripPoints);
    }

    /**
     * Get TripPoints by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TripPoints> getTripPointsById(@PathVariable Long id) {
        Optional<TripPoints> tripPoints = tripPointsService.getTripPointsById(id);
        return tripPoints.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get TripPoints by user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<TripPoints> getTripPointsByUserId(@PathVariable Long userId) {
        TripPoints tripPoints = tripPointsService.getOrCreateTripPoints(userId);
        return ResponseEntity.ok(tripPoints);
    }

    /**
     * Get user's points balance
     */
    @GetMapping("/user/{userId}/balance")
    public ResponseEntity<Map<String, Object>> getUserPointsBalance(@PathVariable Long userId) {
        Integer balance = tripPointsService.getPointsBalance(userId);
        Integer totalEarned = tripPointsService.getTotalEarned(userId);
        Integer totalRedeemed = tripPointsService.getTotalRedeemed(userId);
        
        Map<String, Object> response = Map.of(
            "userId", userId,
            "pointsBalance", balance,
            "totalEarned", totalEarned,
            "totalRedeemed", totalRedeemed
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Award points for review
     */
    @PostMapping("/user/{userId}/award-review")
    public ResponseEntity<Map<String, Object>> awardPointsForReview(
            @PathVariable Long userId,
            @RequestBody Map<String, Integer> request) {
        
        Integer pointsEarned = request.get("pointsEarned");
        if (pointsEarned == null || pointsEarned <= 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid points amount"));
        }
        
        TripPoints tripPoints = tripPointsService.awardPointsForReview(userId, pointsEarned);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "Points awarded successfully",
            "pointsEarned", pointsEarned,
            "newBalance", tripPoints.getPointsBalance(),
            "totalEarned", tripPoints.getTotalEarned()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Award points for experience completion
     */
    @PostMapping("/user/{userId}/award-experience")
    public ResponseEntity<Map<String, Object>> awardPointsForExperience(@PathVariable Long userId) {
        TripPoints tripPoints = tripPointsService.awardPointsForExperienceCompletion(userId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "Points awarded for experience completion",
            "pointsEarned", 25, // POINTS_PER_EXPERIENCE_COMPLETION
            "newBalance", tripPoints.getPointsBalance(),
            "totalEarned", tripPoints.getTotalEarned()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Redeem points
     */
    @PostMapping("/user/{userId}/redeem")
    public ResponseEntity<Map<String, Object>> redeemPoints(
            @PathVariable Long userId,
            @RequestBody Map<String, Integer> request) {
        
        Integer pointsToRedeem = request.get("pointsToRedeem");
        if (pointsToRedeem == null || pointsToRedeem <= 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid points amount"));
        }
        
        if (!tripPointsService.hasEnoughPoints(userId, pointsToRedeem)) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Insufficient points balance"));
        }
        
        boolean success = tripPointsService.redeemPoints(userId, pointsToRedeem);
        
        if (success) {
            Integer newBalance = tripPointsService.getPointsBalance(userId);
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Points redeemed successfully",
                "pointsRedeemed", pointsToRedeem,
                "newBalance", newBalance
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to redeem points"));
        }
    }

    /**
     * Get leaderboard
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<TripPoints>> getLeaderboard() {
        List<TripPoints> leaderboard = tripPointsService.getLeaderboard();
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * Get points policy
     */
    @GetMapping("/policy")
    public ResponseEntity<Map<String, String>> getPointsPolicy() {
        String policy = tripPointsService.getPointsPolicy();
        return ResponseEntity.ok(Map.of("policy", policy));
    }

    /**
     * Create new TripPoints record
     */
    @PostMapping
    public ResponseEntity<TripPoints> createTripPoints(@RequestBody TripPoints tripPoints) {
        TripPoints savedTripPoints = tripPointsService.updateTripPoints(tripPoints);
        return ResponseEntity.ok(savedTripPoints);
    }

    /**
     * Update TripPoints
     */
    @PutMapping("/{id}")
    public ResponseEntity<TripPoints> updateTripPoints(@PathVariable Long id, @RequestBody TripPoints tripPoints) {
        tripPoints.setPointsId(id);
        TripPoints updatedTripPoints = tripPointsService.updateTripPoints(tripPoints);
        return ResponseEntity.ok(updatedTripPoints);
    }

    /**
     * Delete TripPoints
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTripPoints(@PathVariable Long id) {
        tripPointsService.deleteTripPoints(id);
        return ResponseEntity.noContent().build();
    }
}
