package com.backend.service;

import com.backend.dto.SmartSuggestionDTO;
import com.backend.dto.SuggestionsResponseDTO;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceIntelligence;
import com.backend.entity.ExperienceSimilarity;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.ExperienceIntelligenceRepository;
import com.backend.repository.ExperienceSimilarityRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartSuggestionsService {

    @Autowired
    private ExperienceRepository experienceRepository;
    
    @Autowired
    private ExperienceIntelligenceRepository experienceIntelligenceRepository;
    
    @Autowired
    private ExperienceSimilarityRepository experienceSimilarityRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate smart suggestions for improving an experience listing
     */
    public SuggestionsResponseDTO generateSuggestions(Long experienceId) {
        // Get the target experience
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new RuntimeException("Experience not found"));
        
        // Get intelligence data for the experience
        ExperienceIntelligence intelligence = experienceIntelligenceRepository.findById(experienceId)
                .orElseThrow(() -> new RuntimeException("Experience intelligence not found"));
        
        // Get similar experiences
        List<ExperienceSimilarity> similarities = experienceSimilarityRepository
                .findByExperienceIdOrderBySimilarityScoreDesc(experienceId);
        
        // Get intelligence data for similar experiences
        List<Long> similarExperienceIds = similarities.stream()
                .map(ExperienceSimilarity::getSimilarExperienceId)
                .collect(Collectors.toList());
        
        List<ExperienceIntelligence> similarIntelligenceData = experienceIntelligenceRepository
                .findAllById(similarExperienceIds);
        
        // Generate suggestions based on analysis
        List<SmartSuggestionDTO> suggestions = new ArrayList<>();
        
        // Analyze pricing
        suggestions.addAll(analyzePricing(experience, intelligence, similarIntelligenceData));
        
        // Analyze conversion performance
        suggestions.addAll(analyzeConversion(experience, intelligence, similarIntelligenceData));
        
        // Analyze content completeness
        suggestions.addAll(analyzeContent(experience, intelligence, similarIntelligenceData));
        
        // Analyze booking trends
        suggestions.addAll(analyzeBookingTrends(experience, intelligence, similarIntelligenceData));
        
        // Sort by priority and impact
        List<SmartSuggestionDTO> sortedSuggestions = suggestions.stream()
                .sorted((a, b) -> {
                    // Sort by priority first (HIGH > MEDIUM > LOW), then by impact
                    int priorityComparison = b.getPriority().ordinal() - a.getPriority().ordinal();
                    if (priorityComparison != 0) return priorityComparison;
                    return b.getImpactEstimate().compareTo(a.getImpactEstimate());
                })
                .limit(8) // Limit to top 8 suggestions
                .collect(Collectors.toList());
        
        // Build response DTO
        return SuggestionsResponseDTO.builder()
                .experienceId(experienceId)
                .experienceTitle(experience.getTitle())
                .suggestions(sortedSuggestions)
                .similarExperiencesCount(similarities.size())
                .build();
    }
    
    /**
     * Analyze pricing compared to similar experiences
     */
    private List<SmartSuggestionDTO> analyzePricing(Experience experience, ExperienceIntelligence intelligence, 
                                                   List<ExperienceIntelligence> similarData) {
        List<SmartSuggestionDTO> suggestions = new ArrayList<>();
        
        if (similarData.isEmpty()) return suggestions;
        
        try {
            Map<String, Object> performanceMetrics = getPerformanceMetrics(intelligence);
            Double currentConversion = (Double) performanceMetrics.get("conversion_rate");
            
            // Calculate average price and conversion of similar experiences
            List<BigDecimal> similarPrices = new ArrayList<>();
            List<Double> similarConversions = new ArrayList<>();
            
            for (ExperienceIntelligence similar : similarData) {
                Experience similarExp = experienceRepository.findById(similar.getExperienceId()).orElse(null);
                if (similarExp != null && similarExp.getPrice() != null) {
                    similarPrices.add(similarExp.getPrice());
                    
                    Map<String, Object> similarPerformance = getPerformanceMetrics(similar);
                    Double conversion = (Double) similarPerformance.get("conversion_rate");
                    if (conversion != null) {
                        similarConversions.add(conversion);
                    }
                }
            }
            
            if (!similarPrices.isEmpty()) {
                BigDecimal avgSimilarPrice = similarPrices.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(similarPrices.size()), 2, RoundingMode.HALF_UP);
                
                Double avgSimilarConversion = similarConversions.stream()
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0);
                
                BigDecimal currentPrice = experience.getPrice();
                BigDecimal priceDifference = currentPrice.subtract(avgSimilarPrice);
                BigDecimal priceDifferencePercent = priceDifference
                        .divide(avgSimilarPrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                
                // Price too high suggestion
                if (priceDifferencePercent.compareTo(BigDecimal.valueOf(20)) > 0 && 
                    currentConversion < avgSimilarConversion * 0.8) {
                    
                    BigDecimal suggestedPrice = avgSimilarPrice.multiply(BigDecimal.valueOf(1.1));
                    suggestions.add(SmartSuggestionDTO.builder()
                            .type(SmartSuggestionDTO.SuggestionType.PRICING)
                            .title("Reduce Price for Better Conversion")
                            .description(String.format("Your price ($%.0f) is %.0f%% higher than similar experiences ($%.0f). " +
                                    "Consider reducing to $%.0f to improve your %.1f%% conversion rate.",
                                    currentPrice, priceDifferencePercent, avgSimilarPrice, suggestedPrice, currentConversion * 100))
                            .priority(SmartSuggestionDTO.SuggestionPriority.HIGH)
                            .impactEstimate(BigDecimal.valueOf(35))
                            .actionType("price_reduction")
                            .build());
                }
                
                // Price too low suggestion (undervaluing)
                else if (priceDifferencePercent.compareTo(BigDecimal.valueOf(-30)) < 0 && 
                         currentConversion > avgSimilarConversion * 1.2) {
                    
                    BigDecimal suggestedPrice = avgSimilarPrice.multiply(BigDecimal.valueOf(0.9));
                    suggestions.add(SmartSuggestionDTO.builder()
                            .type(SmartSuggestionDTO.SuggestionType.PRICING)
                            .title("Consider Premium Pricing")
                            .description(String.format("Your strong %.1f%% conversion rate suggests you can charge more. " +
                                    "Similar experiences average $%.0f vs your $%.0f.",
                                    currentConversion * 100, avgSimilarPrice, currentPrice))
                            .priority(SmartSuggestionDTO.SuggestionPriority.MEDIUM)
                            .impactEstimate(BigDecimal.valueOf(25))
                            .actionType("price_increase")
                            .build());
                }
            }
            
        } catch (Exception e) {
            // Log error and continue with other suggestions
            System.err.println("Error analyzing pricing: " + e.getMessage());
        }
        
        return suggestions;
    }
    
    /**
     * Analyze conversion rate performance
     */
    private List<SmartSuggestionDTO> analyzeConversion(Experience experience, ExperienceIntelligence intelligence,
                                                      List<ExperienceIntelligence> similarData) {
        List<SmartSuggestionDTO> suggestions = new ArrayList<>();
        
        if (similarData.isEmpty()) return suggestions;
        
        try {
            Map<String, Object> performanceMetrics = getPerformanceMetrics(intelligence);
            Double currentConversion = (Double) performanceMetrics.get("conversion_rate");
            
            // Calculate average conversion of similar experiences
            List<Double> similarConversions = similarData.stream()
                    .map(this::getPerformanceMetrics)
                    .map(metrics -> (Double) metrics.get("conversion_rate"))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            
            if (!similarConversions.isEmpty()) {
                Double avgSimilarConversion = similarConversions.stream()
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0);
                
                // Low conversion rate suggestion
                if (currentConversion < avgSimilarConversion * 0.7) {
                    Double improvementPotential = ((avgSimilarConversion - currentConversion) / currentConversion) * 100;
                    
                    suggestions.add(SmartSuggestionDTO.builder()
                            .type(SmartSuggestionDTO.SuggestionType.CONVERSION)
                            .title("Improve Conversion Rate")
                            .description(String.format("Your %.1f%% conversion rate is below similar experiences (%.1f%%). " +
                                    "Consider improving photos, description, or adding customer reviews.",
                                    currentConversion * 100, avgSimilarConversion * 100))
                            .priority(SmartSuggestionDTO.SuggestionPriority.HIGH)
                            .impactEstimate(BigDecimal.valueOf(Math.min(improvementPotential, 50)))
                            .actionType("improve_listing")
                            .build());
                }
                
                // Content completeness check for low conversion
                Integer contentScore = intelligence.getContentCompletenessScore();
                if (currentConversion < avgSimilarConversion && contentScore < 80) {
                    suggestions.add(SmartSuggestionDTO.builder()
                            .type(SmartSuggestionDTO.SuggestionType.CONTENT)
                            .title("Complete Your Listing")
                            .description(String.format("Your listing is %d%% complete. Adding missing details like " +
                                    "highlights, itinerary, and photos typically improves conversion rates.",
                                    contentScore))
                            .priority(SmartSuggestionDTO.SuggestionPriority.MEDIUM)
                            .impactEstimate(BigDecimal.valueOf(20))
                            .actionType("complete_content")
                            .build());
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error analyzing conversion: " + e.getMessage());
        }
        
        return suggestions;
    }
    
    /**
     * Analyze content quality and completeness
     */
    private List<SmartSuggestionDTO> analyzeContent(Experience experience, ExperienceIntelligence intelligence,
                                                   List<ExperienceIntelligence> similarData) {
        List<SmartSuggestionDTO> suggestions = new ArrayList<>();
        
        try {
            Integer contentScore = intelligence.getContentCompletenessScore();
            
            // Low content completeness
            if (contentScore < 70) {
                suggestions.add(SmartSuggestionDTO.builder()
                        .type(SmartSuggestionDTO.SuggestionType.CONTENT)
                        .title("Enhance Your Experience Description")
                        .description(String.format("Your listing is only %d%% complete. Add detailed highlights, " +
                                "itinerary, and what's included to attract more bookings.", contentScore))
                        .priority(SmartSuggestionDTO.SuggestionPriority.HIGH)
                        .impactEstimate(BigDecimal.valueOf(30))
                        .actionType("improve_description")
                        .build());
            }
            
            // Check for missing highlights
            if (experience.getHighlights() == null || experience.getHighlights().trim().isEmpty()) {
                suggestions.add(SmartSuggestionDTO.builder()
                        .type(SmartSuggestionDTO.SuggestionType.CONTENT)
                        .title("Add Experience Highlights")
                        .description("Experiences with clear highlights get 25% more views. " +
                                "List your top 3-5 unique features or activities.")
                        .priority(SmartSuggestionDTO.SuggestionPriority.MEDIUM)
                        .impactEstimate(BigDecimal.valueOf(25))
                        .actionType("add_highlights")
                        .build());
            }
            
            // Duration analysis
            Map<String, Object> contentFeatures = intelligence.getContentFeatures();
            String durationCategory = (String) contentFeatures.get("duration_category");
            
            if ("short".equals(durationCategory) && similarData.size() > 0) {
                long longerExperiences = similarData.stream()
                        .map(this::getContentFeatures)
                        .map(features -> (String) features.get("duration_category"))
                        .filter(cat -> "half_day".equals(cat) || "full_day".equals(cat))
                        .count();
                
                if (longerExperiences > similarData.size() / 2) {
                    suggestions.add(SmartSuggestionDTO.builder()
                            .type(SmartSuggestionDTO.SuggestionType.DURATION)
                            .title("Consider Extending Duration")
                            .description("Most similar experiences offer longer durations and typically " +
                                    "command higher prices. Consider extending your experience.")
                            .priority(SmartSuggestionDTO.SuggestionPriority.LOW)
                            .impactEstimate(BigDecimal.valueOf(15))
                            .actionType("extend_duration")
                            .build());
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error analyzing content: " + e.getMessage());
        }
        
        return suggestions;
    }
    
    /**
     * Analyze booking trends and seasonality
     */
    private List<SmartSuggestionDTO> analyzeBookingTrends(Experience experience, ExperienceIntelligence intelligence,
                                                         List<ExperienceIntelligence> similarData) {
        List<SmartSuggestionDTO> suggestions = new ArrayList<>();
        
        try {
            Map<String, Object> performanceMetrics = getPerformanceMetrics(intelligence);
            String bookingTrend = (String) performanceMetrics.get("booking_trend");
            Integer recentBookings = (Integer) performanceMetrics.get("recent_bookings");
            Integer lastMonth = (Integer) performanceMetrics.get("bookings_last_month");
            
            // Declining trend
            if ("decreasing".equals(bookingTrend)) {
                suggestions.add(SmartSuggestionDTO.builder()
                        .type(SmartSuggestionDTO.SuggestionType.PERFORMANCE)
                        .title("Reverse Booking Decline")
                        .description("Your bookings have declined recently. Consider refreshing your photos, " +
                                "updating your description, or offering seasonal promotions.")
                        .priority(SmartSuggestionDTO.SuggestionPriority.HIGH)
                        .impactEstimate(BigDecimal.valueOf(40))
                        .actionType("reverse_decline")
                        .build());
            }
            
            // No recent bookings
            if (recentBookings == 0 && lastMonth == 0) {
                suggestions.add(SmartSuggestionDTO.builder()
                        .type(SmartSuggestionDTO.SuggestionType.PERFORMANCE)
                        .title("Boost Visibility")
                        .description("No recent bookings detected. Consider updating your listing, " +
                                "adding new photos, or adjusting your pricing to increase visibility.")
                        .priority(SmartSuggestionDTO.SuggestionPriority.HIGH)
                        .impactEstimate(BigDecimal.valueOf(35))
                        .actionType("boost_visibility")
                        .build());
            }
            
            // Increasing trend - capitalize
            if ("increasing".equals(bookingTrend)) {
                suggestions.add(SmartSuggestionDTO.builder()
                        .type(SmartSuggestionDTO.SuggestionType.PERFORMANCE)
                        .title("Capitalize on Growth")
                        .description("Great momentum! Your bookings are increasing. Consider adding more " +
                                "time slots or slightly raising prices to maximize revenue.")
                        .priority(SmartSuggestionDTO.SuggestionPriority.MEDIUM)
                        .impactEstimate(BigDecimal.valueOf(20))
                        .actionType("capitalize_growth")
                        .build());
            }
            
        } catch (Exception e) {
            System.err.println("Error analyzing booking trends: " + e.getMessage());
        }
        
        return suggestions;
    }
    
    /**
     * Helper method to safely extract performance metrics from intelligence data
     */
    private Map<String, Object> getPerformanceMetrics(ExperienceIntelligence intelligence) {
        try {
            Map<String, Object> data = intelligence.getIntelligenceData();
            Object performanceObj = data.get("performance_metrics");
            if (performanceObj instanceof Map) {
                return (Map<String, Object>) performanceObj;
            }
        } catch (Exception e) {
            System.err.println("Error extracting performance metrics: " + e.getMessage());
        }
        return new HashMap<>();
    }
    
    /**
     * Helper method to safely extract content features from intelligence data
     */
    private Map<String, Object> getContentFeatures(ExperienceIntelligence intelligence) {
        try {
            return intelligence.getContentFeatures();
        } catch (Exception e) {
            System.err.println("Error extracting content features: " + e.getMessage());
            return new HashMap<>();
        }
    }
}