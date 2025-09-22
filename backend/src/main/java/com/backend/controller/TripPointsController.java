package com.backend.controller;

import com.backend.entity.TripPoints;
import com.backend.service.TripPointsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
     * Get all TripPoints transactions
     */
    @GetMapping
    public ResponseEntity<List<TripPoints>> getAllTripPoints() {
        try {
            List<TripPoints> tripPoints = tripPointsService.getAllTripPoints();
            return ResponseEntity.ok(tripPoints);
        } catch (Exception e) {
            System.err.println("Error retrieving all trip points: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get TripPoints transaction by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TripPoints> getTripPointsById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<TripPoints> tripPoints = tripPointsService.getTripPointsById(id);
            if (tripPoints.isPresent()) {
                return ResponseEntity.ok(tripPoints.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving trip points with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get user's current balance and stats
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
     * Get user's TripPoints transaction history
     */
    @GetMapping("/user/{userId}/history")
    public ResponseEntity<List<TripPoints>> getTripPointsHistory(@PathVariable Long userId) {
        List<TripPoints> history = tripPointsService.getTripPointsHistory(userId);
        return ResponseEntity.ok(history);
    }

    /**
     * Award points for review
     */
    @PostMapping("/user/{userId}/award-review")
    public ResponseEntity<Map<String, Object>> awardPointsForReview(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {

        Long referenceId = request.get("referenceId") != null ? 
            Long.valueOf(request.get("referenceId").toString()) : null;

        try {
            TripPoints transaction = tripPointsService.awardPointsForReview(userId, referenceId);

            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Points awarded for review",
                "transactionId", transaction.getPointsId(),
                "pointsEarned", transaction.getPointsChange(),
                "newBalance", transaction.getPointsBalanceAfter(),
                "transactionType", transaction.getTransactionType().name(),
                "referenceId", referenceId
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Award points for experience completion
     */
    @PostMapping("/user/{userId}/award-experience")
    public ResponseEntity<Map<String, Object>> awardPointsForExperience(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {

        Long referenceId = request.get("referenceId") != null ? 
            Long.valueOf(request.get("referenceId").toString()) : null;

        try {
            TripPoints transaction = tripPointsService.awardPointsForExperience(userId, referenceId);

            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Points awarded for experience completion",
                "transactionId", transaction.getPointsId(),
                "pointsEarned", transaction.getPointsChange(),
                "newBalance", transaction.getPointsBalanceAfter(),
                "transactionType", transaction.getTransactionType().name(),
                "referenceId", referenceId
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Redeem points
     */
    @PostMapping("/user/{userId}/redeem")
    public ResponseEntity<Map<String, Object>> redeemPoints(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {

        Integer pointsToRedeem = (Integer) request.get("pointsToRedeem");

        if (pointsToRedeem == null || pointsToRedeem <= 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid points amount"));
        }

        try {
            TripPoints transaction = tripPointsService.redeemPoints(userId, pointsToRedeem);

            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Points redeemed successfully",
                "transactionId", transaction.getPointsId(),
                "pointsRedeemed", Math.abs(transaction.getPointsChange()),
                "newBalance", transaction.getPointsBalanceAfter(),
                "transactionType", transaction.getTransactionType().name()
            );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to redeem points"));
        }
    }

    /**
     * Get leaderboard
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Object[]>> getLeaderboard() {
        List<Object[]> leaderboard = tripPointsService.getLeaderboard();
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
     * Create new TripPoints transaction
     */
    @PostMapping
    public ResponseEntity<TripPoints> createTripPoints(@RequestBody TripPoints tripPoints) {
        try {
            if (tripPoints == null) {
                return ResponseEntity.badRequest().build();
            }
            
            TripPoints savedTripPoints = tripPointsService.updateTripPoints(tripPoints);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTripPoints);
        } catch (Exception e) {
            System.err.println("Error creating trip points: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Update TripPoints transaction
     */
    @PutMapping("/{id}")
    public ResponseEntity<TripPoints> updateTripPoints(@PathVariable Long id, @RequestBody TripPoints tripPoints) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (tripPoints == null) {
                return ResponseEntity.badRequest().build();
            }
            
            tripPoints.setPointsId(id);
            TripPoints updatedTripPoints = tripPointsService.updateTripPoints(tripPoints);
            return ResponseEntity.ok(updatedTripPoints);
        } catch (Exception e) {
            System.err.println("Error updating trip points with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Delete TripPoints transaction
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTripPoints(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            tripPointsService.deleteTripPoints(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting trip points with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
