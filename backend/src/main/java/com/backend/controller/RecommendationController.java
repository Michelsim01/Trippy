package com.backend.controller;

import com.backend.dto.RecommendationResponseDTO;
import com.backend.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    /**
     * Get personalized Discover Weekly recommendations for a user
     * @param userId The user ID
     * @return List of recommended experiences
     */
    @GetMapping("/discover-weekly")
    public ResponseEntity<?> getDiscoverWeekly(@RequestParam Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid user ID"
                ));
            }

            List<RecommendationResponseDTO> recommendations =
                recommendationService.getDiscoverWeeklyRecommendations(userId);

            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            e.printStackTrace();
            // Return fallback recommendations on error
            try {
                List<RecommendationResponseDTO> fallback =
                    recommendationService.getFallbackRecommendations();
                return ResponseEntity.ok(fallback);
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to fetch recommendations: " + e.getMessage()
                ));
            }
        }
    }

    /**
     * Get similar experiences for a given experience
     * @param experienceId The experience ID
     * @param limit Number of similar experiences to return (default: 10)
     * @return List of similar experiences
     */
    @GetMapping("/similar/{experienceId}")
    public ResponseEntity<?> getSimilarExperiences(
        @PathVariable Long experienceId,
        @RequestParam(defaultValue = "10") int limit
    ) {
        try {
            if (experienceId == null || experienceId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid experience ID"
                ));
            }

            if (limit <= 0 || limit > 50) {
                limit = 10; // Default to 10 if invalid
            }

            List<RecommendationResponseDTO> similar =
                recommendationService.getSimilarExperiences(experienceId, limit);

            return ResponseEntity.ok(similar);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to fetch similar experiences: " + e.getMessage()
            ));
        }
    }

    /**
     * Get user profile summary based on their cluster
     * @param userId The user ID
     * @return User profile summary
     */
    @GetMapping("/profile-summary")
    public ResponseEntity<?> getProfileSummary(@RequestParam Long userId) {
        try {
            String summary = recommendationService.getUserProfileSummary(userId);
            return ResponseEntity.ok(Map.of(
                "summary", summary != null ? summary : "Explore amazing experiences curated just for you"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of(
                "summary", "Explore amazing experiences curated just for you"
            ));
        }
    }

    /**
     * Health check endpoint for recommendation system
     * @return System status
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "recommendation-system",
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Debug endpoint to test recommendations and catch errors
     * @param userId The user ID to check
     * @return Debug information or error
     */
    @GetMapping("/debug/{userId}")
    public ResponseEntity<?> debugRecommendations(@PathVariable Long userId) {
        try {
            // Try to get recommendations and see what fails
            List<RecommendationResponseDTO> recommendations =
                recommendationService.getDiscoverWeeklyRecommendations(userId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "recommendationCount", recommendations.size(),
                "firstFewRecommendations", recommendations.stream().limit(3).map(r -> r.getTitle()).toList()
            ));
        } catch (Exception e) {
            // Return detailed error information
            Map<String, Object> errorInfo = new HashMap<>();
            errorInfo.put("success", false);
            errorInfo.put("errorMessage", e.getMessage());
            errorInfo.put("errorClass", e.getClass().getName());

            // Get the first few stack trace elements
            if (e.getStackTrace() != null && e.getStackTrace().length > 0) {
                errorInfo.put("errorLocation", e.getStackTrace()[0].toString());
            }

            // Print to console as well
            System.err.println("=== RECOMMENDATION DEBUG ERROR ===");
            System.err.println("User ID: " + userId);
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.err.println("==================================");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorInfo);
        }
    }
}
