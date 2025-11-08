package com.backend.service;

import com.backend.dto.ClusterCharacteristics;
import com.backend.dto.RecommendationResponseDTO;
import com.backend.dto.ScoredExperience;
import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Autowired
    private UserAnalyticsProfileRepository userProfileRepo;

    @Autowired
    private ClusterProfileRepository clusterProfileRepo;

    @Autowired
    private ExperienceIntelligenceRepository intelligenceRepo;

    @Autowired
    private ExperienceSimilarityRepository similarityRepo;

    @Autowired
    private ExperienceRepository experienceRepo;

    @Autowired
    private BookingRepository bookingRepo;

    // Weights for final score calculation
    private static final double CLUSTER_MATCH_WEIGHT = 0.4;
    private static final double SIMILARITY_WEIGHT = 0.3;
    private static final double POPULARITY_WEIGHT = 0.2;
    private static final double QUALITY_WEIGHT = 0.1;

    /**
     * Get personalized Discover Weekly recommendations for a user
     * @param userId The user ID
     * @return List of recommended experiences
     */
    public List<RecommendationResponseDTO> getDiscoverWeeklyRecommendations(Long userId) {
        try {
            // Check if user has analytics profile
            Optional<UserAnalyticsProfile> userProfileOpt = userProfileRepo.findByUserId(userId);

            if (userProfileOpt.isEmpty() || userProfileOpt.get().getClusterId() == null) {
                // Fallback: popularity-based recommendations
                return getFallbackRecommendations();
            }

            UserAnalyticsProfile userProfile = userProfileOpt.get();
            Integer clusterId = userProfile.getClusterId();

            // Get cluster profile
            Optional<ClusterProfile> clusterProfileOpt = clusterProfileRepo.findByClusterId(clusterId);
            if (clusterProfileOpt.isEmpty()) {
                return getFallbackRecommendations();
            }

            ClusterProfile clusterProfile = clusterProfileOpt.get();

            // Extract cluster characteristics for pre-filtering
            ClusterCharacteristics characteristics = extractClusterCharacteristics(clusterProfile);

            // Execute smart pre-filter to get candidates
            List<ExperienceIntelligence> candidates = executeSmartPreFilter(
                userId,
                clusterId,
                characteristics
            );

            // Score each candidate
            List<ScoredExperience> scoredExperiences = new ArrayList<>();

            for (ExperienceIntelligence intelligence : candidates) {
                // Get the actual experience entity
                Optional<Experience> expOpt = experienceRepo.findById(intelligence.getExperienceId());
                if (expOpt.isEmpty()) {
                    continue;
                }

                Experience exp = expOpt.get();

                // Calculate component scores
                double clusterMatchScore = calculateClusterMatchScore(intelligence, clusterProfile);
                double similarityScore = calculateSimilarityScore(intelligence, userId);
                double popularityScore = intelligence.getPopularityScore().doubleValue() / 100.0;
                double qualityScore = calculateQualityScore(intelligence, exp);

                // Calculate base final score
                double baseScore =
                    (clusterMatchScore * CLUSTER_MATCH_WEIGHT) +
                    (similarityScore * SIMILARITY_WEIGHT) +
                    (popularityScore * POPULARITY_WEIGHT) +
                    (qualityScore * QUALITY_WEIGHT);

                // Apply review penalty for experiences with few reviews
                // This ensures experiences with proven ratings rank higher
                double reviewPenalty = calculateReviewPenalty(exp);
                double finalScore = baseScore * reviewPenalty;

                // Create scored experience with breakdown
                ScoredExperience scored = new ScoredExperience(exp, intelligence, finalScore);
                scored.addScore("base_score", baseScore);
                scored.addScore("review_penalty", reviewPenalty);
                scored.addScore("cluster_match", clusterMatchScore);
                scored.addScore("similarity", similarityScore);
                scored.addScore("popularity", popularityScore);
                scored.addScore("quality", qualityScore);
                scored.setRecommendationReason(generateRecommendationReason(
                    exp, intelligence, clusterProfile, clusterMatchScore, similarityScore, popularityScore));

                scoredExperiences.add(scored);
            }

            // Sort by final score and return top 20
            return scoredExperiences.stream()
                .sorted(Comparator.comparing(ScoredExperience::getFinalScore).reversed())
                .limit(20)
                .map(this::toRecommendationDTO)
                .collect(Collectors.toList());

        } catch (Exception e) {
            e.printStackTrace();
            // Fallback on any error
            return getFallbackRecommendations();
        }
    }

    /**
     * Get user profile summary based on their cluster
     * @param userId The user ID
     * @return User profile summary string
     */
    public String getUserProfileSummary(Long userId) {
        try {
            if (userId == null) {
                return null;
            }

            Optional<UserAnalyticsProfile> userProfileOpt = userProfileRepo.findByUserId(userId);

            if (userProfileOpt.isEmpty()) {
                return null; // No profile for this user
            }

            UserAnalyticsProfile userProfile = userProfileOpt.get();
            Integer clusterId = userProfile.getClusterId();

            if (clusterId == null) {
                return null; // No cluster assigned
            }

            Optional<ClusterProfile> clusterProfileOpt = clusterProfileRepo.findByClusterId(clusterId);
            if (clusterProfileOpt.isEmpty()) {
                return null; // No cluster profile found
            }

            ClusterProfile clusterProfile = clusterProfileOpt.get();

            if (clusterProfile.getProfileData() == null) {
                return null; // No profile data
            }

            // Get dominant interests
            Map<String, Double> interests = clusterProfile.getInterestPreferences();

            if (interests == null || interests.isEmpty()) {
                return "Explore amazing experiences curated just for you";
            }

            String dominantInterest = interests.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("adventure");

            // Get secondary interest
            String secondaryInterest = interests.entrySet().stream()
                .filter(e -> !e.getKey().equals(dominantInterest))
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

            // Get travel style from profile data
            Map<String, Object> profileData = userProfile.getProfileData();
            String travelStyle = null;
            if (profileData != null && profileData.containsKey("travel_style")) {
                Object travelStyleObj = profileData.get("travel_style");
                if (travelStyleObj != null) {
                    travelStyle = travelStyleObj.toString().replace("_", "-");
                }
            }

            // Build summary message
            StringBuilder summary = new StringBuilder();
            summary.append("Based on your profile, you enjoy ");
            summary.append(dominantInterest);

            if (secondaryInterest != null) {
                summary.append(" and ").append(secondaryInterest);
            }

            summary.append(" experiences");

            if (travelStyle != null && !travelStyle.isEmpty() && !travelStyle.equals("unknown")) {
                summary.append(" with a ").append(travelStyle).append(" style");
            }

            return summary.toString();

        } catch (Exception e) {
            System.err.println("Error generating profile summary for user " + userId);
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Get similar experiences for a given experience
     * @param experienceId The experience ID
     * @param limit Number of similar experiences to return
     * @return List of similar experiences
     */
    public List<RecommendationResponseDTO> getSimilarExperiences(Long experienceId, int limit) {
        List<ExperienceSimilarity> similarities = similarityRepo.findTopSimilarExperiences(experienceId, limit);

        List<RecommendationResponseDTO> recommendations = new ArrayList<>();
        for (ExperienceSimilarity sim : similarities) {
            Optional<Experience> expOpt = experienceRepo.findById(sim.getSimilarExperienceId());
            if (expOpt.isPresent()) {
                Experience exp = expOpt.get();
                RecommendationResponseDTO dto = new RecommendationResponseDTO();
                dto.setExperienceId(exp.getExperienceId());
                dto.setTitle(exp.getTitle());
                dto.setLocation(exp.getLocation());
                dto.setCountry(exp.getCountry());
                dto.setPrice(exp.getPrice());
                dto.setOriginalPrice(exp.getOriginalPrice());
                dto.setDiscountPercentage(exp.getDiscountPercentage());
                dto.setCategory(exp.getCategory() != null ? exp.getCategory().name() : null);
                dto.setAverageRating(exp.getAverageRating() != null ? exp.getAverageRating().doubleValue() : null);
                dto.setTotalReviews(exp.getTotalReviews());
                dto.setCoverPhotoUrl(exp.getCoverPhotoUrl());
                dto.setShortDescription(exp.getShortDescription());
                dto.setDuration(exp.getDuration());
                dto.setParticipantsAllowed(exp.getParticipantsAllowed());
                dto.setRecommendationScore(sim.getSimilarityScore().doubleValue());
                dto.setRecommendationReason("Similar to this experience");

                recommendations.add(dto);
            }
        }

        return recommendations;
    }

    /**
     * Fallback recommendations based on popularity with scores
     * Used for users without analytics profiles (new users, no booking history)
     * @return List of popular experiences with popularity-based scores
     */
    public List<RecommendationResponseDTO> getFallbackRecommendations() {
        // Get all active experiences with intelligence data
        List<Experience> allExperiences = experienceRepo.findAll().stream()
            .filter(exp -> exp.getStatus() == ExperienceStatus.ACTIVE)
            .collect(Collectors.toList());

        // Calculate popularity score for each experience
        List<ScoredExperience> scoredExperiences = new ArrayList<>();

        for (Experience exp : allExperiences) {
            // Try to get intelligence data
            Optional<ExperienceIntelligence> intelligenceOpt =
                intelligenceRepo.findById(exp.getExperienceId());

            if (intelligenceOpt.isEmpty()) {
                continue; // Skip experiences without intelligence data
            }

            ExperienceIntelligence intelligence = intelligenceOpt.get();

            // Calculate popularity-based score (0-1 scale)
            double popularityScore = 0.0;
            if (intelligence.getPopularityScore() != null) {
                popularityScore = intelligence.getPopularityScore().doubleValue() / 100.0;
            }

            // Calculate quality score
            double ratingScore = 0.0;
            if (exp.getAverageRating() != null) {
                ratingScore = exp.getAverageRating().doubleValue() / 5.0;
            }

            // Calculate review volume score (normalize by max reviews)
            double reviewScore = 0.0;
            if (exp.getTotalReviews() != null && exp.getTotalReviews() > 0) {
                reviewScore = Math.min(exp.getTotalReviews() / 20.0, 1.0); // Cap at 20 reviews = 1.0
            }

            // Content completeness
            double contentScore = 0.0;
            if (intelligence.getContentCompletenessScore() != null) {
                contentScore = intelligence.getContentCompletenessScore().doubleValue() / 100.0;
            }

            // Weighted popularity score
            // 40% rating quality, 30% popularity, 20% review volume, 10% content
            double finalScore = (ratingScore * 0.4) +
                               (popularityScore * 0.3) +
                               (reviewScore * 0.2) +
                               (contentScore * 0.1);

            // Apply review penalty (same as personalized recommendations)
            double reviewPenalty = calculateReviewPenalty(exp);
            finalScore *= reviewPenalty;

            ScoredExperience scored = new ScoredExperience(exp, intelligence, finalScore);
            scored.addScore("rating", ratingScore);
            scored.addScore("popularity", popularityScore);
            scored.addScore("reviews", reviewScore);
            scored.addScore("content", contentScore);
            scored.addScore("review_penalty", reviewPenalty);
            scored.setRecommendationReason("Popular experience");

            scoredExperiences.add(scored);
        }

        // Sort by score and take top 20
        return scoredExperiences.stream()
            .sorted(Comparator.comparing(ScoredExperience::getFinalScore).reversed())
            .limit(20)
            .map(this::toRecommendationDTO)
            .collect(Collectors.toList());
    }

    /**
     * Extract cluster characteristics for pre-filtering
     */
    private ClusterCharacteristics extractClusterCharacteristics(ClusterProfile profile) {
        Map<String, Double> interests = profile.getInterestPreferences();

        // Get dominant interests (threshold > 0.5)
        List<String> dominantInterests = interests.entrySet().stream()
            .filter(e -> e.getValue() > 0.5)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        // Map interests to categories
        List<String> relevantCategories = new ArrayList<>();
        if (dominantInterests.contains("adventure") || dominantInterests.contains("nature")) {
            relevantCategories.addAll(List.of("ADVENTURE", "DAYTRIP"));
        }
        if (dominantInterests.contains("cultural")) {
            relevantCategories.addAll(List.of("GUIDED_TOUR", "WORKSHOP"));
        }
        if (dominantInterests.contains("relaxation") || dominantInterests.contains("social")) {
            relevantCategories.addAll(List.of("WATER_ACTIVITY", "WORKSHOP"));
        }

        // Ensure we have at least some categories
        if (relevantCategories.isEmpty()) {
            relevantCategories.addAll(List.of("ADVENTURE", "GUIDED_TOUR", "DAYTRIP", "WORKSHOP"));
        }

        return new ClusterCharacteristics(
            dominantInterests,
            relevantCategories,
            (int) Math.round(profile.getAvgBudgetScore()),
            profile.getAvgBookingAmount()
        );
    }

    /**
     * Execute smart pre-filter query to get candidate experiences
     */
    private List<ExperienceIntelligence> executeSmartPreFilter(
        Long userId,
        Integer clusterId,
        ClusterCharacteristics characteristics
    ) {
        // For simplicity, we'll use a basic query approach
        // Get all intelligence records and filter in Java
        List<ExperienceIntelligence> allIntelligence = intelligenceRepo.findAll();

        return allIntelligence.stream()
            .filter(ei -> {
                try {
                    // Get the experience
                    Optional<Experience> expOpt = experienceRepo.findById(ei.getExperienceId());
                    if (expOpt.isEmpty() || expOpt.get().getStatus() != ExperienceStatus.ACTIVE) {
                        return false;
                    }

                    Experience exp = expOpt.get();

                    // Filter by quality thresholds (with null checks)
                    if (ei.getPopularityScore() == null || ei.getPopularityScore().doubleValue() < 10) {
                        return false;
                    }

                    if (ei.getSentimentScore() == null || ei.getSentimentScore().doubleValue() < -0.2) {
                        return false;
                    }

                    // Filter by budget range
                    int expBudget = ei.getBudgetScore();
                    int clusterBudget = characteristics.getAvgBudgetScore();
                    if (Math.abs(expBudget - clusterBudget) > 2) {
                        return false;
                    }

                    // Filter by price range
                    if (exp.getPrice() != null) {
                        double price = exp.getPrice().doubleValue();
                        double avgAmount = characteristics.getAvgBookingAmount();
                        if (price < avgAmount * 0.5 || price > avgAmount * 2.0) {
                            return false;
                        }
                    }

                    // Filter by category or interests
                    Map<String, Object> activityKeywords = ei.getActivityKeywords();
                    boolean matchesInterests = characteristics.getDominantInterests().stream()
                        .anyMatch(interest -> activityKeywords.containsKey(interest));

                    boolean matchesCategory = exp.getCategory() != null &&
                        characteristics.getRelevantCategories().contains(exp.getCategory().name());

                    return matchesInterests || matchesCategory;
                } catch (Exception e) {
                    System.err.println("ERROR in pre-filter for experience " + ei.getExperienceId() + ": " + e.getMessage());
                    e.printStackTrace();
                    return false;
                }
            })
            .sorted((e1, e2) -> e2.getPopularityScore().compareTo(e1.getPopularityScore()))
            .limit(50)
            .collect(Collectors.toList());
    }

    /**
     * Calculate cluster match score (0-1)
     */
    private double calculateClusterMatchScore(ExperienceIntelligence intelligence, ClusterProfile clusterProfile) {
        // Get experience interests
        Map<String, Object> activityKeywords = intelligence.getActivityKeywords();
        Set<String> experienceInterests = activityKeywords.keySet();

        // Get cluster interests
        Map<String, Double> clusterInterests = clusterProfile.getInterestPreferences();

        // Calculate interest match
        double categoryMatch = 0.0;
        int matchCount = 0;

        for (String interest : experienceInterests) {
            if (clusterInterests.containsKey(interest)) {
                categoryMatch += clusterInterests.get(interest);
                matchCount++;
            }
        }

        categoryMatch = matchCount > 0 ? categoryMatch / matchCount : 0.0;

        // Calculate budget match
        double clusterBudget = clusterProfile.getAvgBudgetScore();
        int expBudget = intelligence.getBudgetScore();

        double budgetDistance = Math.abs(clusterBudget - expBudget);
        double budgetMatch = 1.0 - (budgetDistance / 3.0);
        budgetMatch = Math.max(0.0, Math.min(1.0, budgetMatch));

        // Weighted combination (70% interests, 30% budget)
        return (categoryMatch * 0.7) + (budgetMatch * 0.3);
    }

    /**
     * Calculate similarity score based on user's booking history (0-1)
     */
    private double calculateSimilarityScore(ExperienceIntelligence candidate, Long userId) {
        // Get user's completed bookings
        List<Booking> userBookings = bookingRepo.findByTraveler_IdAndStatus(userId, BookingStatus.COMPLETED);

        if (userBookings.isEmpty()) {
            return 0.5; // Neutral score for new users
        }

        double maxSimilarity = 0.0;

        for (Booking booking : userBookings) {
            // Get experience ID from booking's schedule
            if (booking.getExperienceSchedule() != null &&
                booking.getExperienceSchedule().getExperience() != null) {

                Long bookedExpId = booking.getExperienceSchedule().getExperience().getExperienceId();

                // Check if candidate is similar to this booked experience
                Optional<ExperienceSimilarity> similarity =
                    similarityRepo.findSimilarityBetween(bookedExpId, candidate.getExperienceId());

                if (similarity.isPresent()) {
                    double score = similarity.get().getSimilarityScore().doubleValue();
                    maxSimilarity = Math.max(maxSimilarity, score);
                }
            }
        }

        return maxSimilarity;
    }

    /**
     * Calculate quality score (0-1)
     */
    private double calculateQualityScore(ExperienceIntelligence intelligence, Experience experience) {
        // Rating score
        double ratingScore = 0.0;
        if (experience.getAverageRating() != null) {
            ratingScore = experience.getAverageRating().doubleValue() / 5.0;
        }

        // Review quality score
        double reviewQuality = intelligence.getReviewQualityScore() / 100.0;

        // Content completeness score
        double contentComplete = intelligence.getContentCompletenessScore() / 100.0;

        // Sentiment score (normalize -1 to 1 → 0 to 1)
        double sentiment = (intelligence.getSentimentScore().doubleValue() + 1.0) / 2.0;

        // Weighted combination - reduced rating influence, focus on content quality
        return (ratingScore * 0.15) + (reviewQuality * 0.20) +
               (contentComplete * 0.35) + (sentiment * 0.30);
    }

    /**
     * Calculate review penalty multiplier (0.5-1.0)
     * Experiences with more reviews get higher multipliers (closer to 1.0)
     * Experiences with few/no reviews get lower multipliers (closer to 0.5)
     * This ensures proven experiences rank higher than unproven ones
     */
    private double calculateReviewPenalty(Experience experience) {
        Integer totalReviews = experience.getTotalReviews();

        if (totalReviews == null || totalReviews == 0) {
            // No reviews: slight penalty (90% of score) - still show good personalized matches
            return 0.90;
        } else if (totalReviews < 3) {
            // 1-2 reviews: minimal penalty (95% of score)
            return 0.95;
        } else if (totalReviews < 5) {
            // 3-4 reviews: tiny boost (98% of score)
            return 0.98;
        } else {
            // 5+ reviews: full confidence, no penalty (100% of score)
            return 1.0;
        }
    }

    /**
     * Generate human-readable recommendation reason
     */
    private String generateRecommendationReason(Experience exp, ExperienceIntelligence intelligence,
                                               ClusterProfile clusterProfile, double clusterMatch,
                                               double similarity, double popularity) {
        // Determine the primary reason based on which score is highest
        String category = exp.getCategory() != null ? exp.getCategory().name().toLowerCase().replace("_", " ") : "experience";

        // High similarity - user has booked similar experiences
        if (similarity > 0.6) {
            return "Based on your past bookings, you might enjoy this " + category;
        }

        // Strong cluster match - aligns with user's traveler persona
        if (clusterMatch > 0.7) {
            // Get dominant interest from cluster profile
            Map<String, Double> interests = clusterProfile.getInterestPreferences();
            String dominantInterest = interests.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey())
                .orElse("travel");

            return "Perfect for " + dominantInterest + " enthusiasts like you";
        }

        // Good cluster match with specific activity keywords
        if (clusterMatch > 0.5) {
            Map<String, Object> keywords = intelligence.getActivityKeywords();
            if (!keywords.isEmpty()) {
                String topKeyword = keywords.keySet().iterator().next();
                return "Matches your interest in " + topKeyword;
            }
        }

        // High popularity - trending or highly rated
        if (popularity > 0.7) {
            Integer reviews = exp.getTotalReviews();
            if (reviews != null && reviews > 10) {
                return "Highly rated by travelers with " + reviews + " reviews";
            }
            return "Trending experience in " + exp.getCountry();
        }

        // Default fallback
        return "Recommended for your next adventure";
    }

    /**
     * Convert ScoredExperience to DTO
     */
    private RecommendationResponseDTO toRecommendationDTO(ScoredExperience scored) {
        Experience exp = scored.getExperience();

        RecommendationResponseDTO dto = new RecommendationResponseDTO();
        dto.setExperienceId(exp.getExperienceId());
        dto.setTitle(exp.getTitle());
        dto.setLocation(exp.getLocation());
        dto.setCountry(exp.getCountry());
        dto.setPrice(exp.getPrice());
        dto.setOriginalPrice(exp.getOriginalPrice());
        dto.setDiscountPercentage(exp.getDiscountPercentage());
        dto.setCategory(exp.getCategory() != null ? exp.getCategory().name() : null);
        dto.setAverageRating(exp.getAverageRating() != null ? exp.getAverageRating().doubleValue() : null);
        dto.setTotalReviews(exp.getTotalReviews());
        dto.setCoverPhotoUrl(exp.getCoverPhotoUrl());
        dto.setShortDescription(exp.getShortDescription());
        dto.setDuration(exp.getDuration());
        dto.setParticipantsAllowed(exp.getParticipantsAllowed());
        dto.setRecommendationScore(scored.getFinalScore());
        dto.setRecommendationReason(scored.getRecommendationReason());
        dto.setScoreBreakdown(scored.getScoreBreakdown());

        return dto;
    }
}
