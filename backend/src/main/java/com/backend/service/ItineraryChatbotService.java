package com.backend.service;

import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.*;
import com.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ItineraryChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(ItineraryChatbotService.class);

    @Autowired
    private ChatbotSessionRepository chatbotSessionRepository;

    @Autowired
    private ChatbotMessageRepository chatbotMessageRepository;

    @Autowired
    private ExperienceKnowledgeBaseRepository experienceKnowledgeBaseRepository;

    @Autowired
    private ItineraryDistanceMatrixRepository itineraryDistanceMatrixRepository;

    @Autowired
    private ItineraryAvailabilityIndexRepository itineraryAvailabilityIndexRepository;

    @Autowired
    private OpenAIService openAIService;

    private static final int MAX_EXPERIENCES = 10;
    private static final int MAX_CONTEXT_LENGTH = 8000;
    private static final double SIMILARITY_THRESHOLD = 1.5;

    public ChatbotMessageResponse processMessage(ChatbotMessageRequest request, Long userId) {
        try {
            // Get or create chat session
            ChatbotSession session = getOrCreateSession(request.getSessionId(), userId);

            // Build comprehensive context for itinerary planning
            String context = buildItineraryContext(request.getMessage());

            logger.info("Built context for itinerary planning (length: {})", context.length());
            logger.debug("Context content: {}", context);

            // Generate AI response with itinerary planning context
            String botResponse = openAIService.generateChatResponse(request.getMessage(), context);

            // Save the conversation
            ChatbotMessage chatbotMessage = saveChatMessage(session, request.getMessage(), botResponse, "[]");

            // Build response
            ChatbotMessageResponse response = new ChatbotMessageResponse(botResponse, session.getSessionId());
            response.setTimestamp(chatbotMessage.getCreatedAt());

            logger.info("Processed itinerary chat message for session: {}", session.getSessionId());
            return response;

        } catch (Exception e) {
            logger.error("Error processing itinerary chat message: {}", e.getMessage(), e);
            return new ChatbotMessageResponse(
                "I'm sorry, I encountered an error planning your itinerary. Please try again.",
                request.getSessionId() != null ? request.getSessionId() : generateSessionId()
            );
        }
    }

    private String buildItineraryContext(String userMessage) {
        StringBuilder context = new StringBuilder();

        try {
            // 1. Generate embedding for user query
            List<Double> embedding = openAIService.generateEmbedding(userMessage);

            if (embedding == null) {
                logger.warn("Failed to generate embedding for query: {}", userMessage);
                return "I'm having trouble understanding your request. Please try rephrasing.";
            }

            // 2. Search for relevant experiences using vector similarity
            String embeddingString = convertEmbeddingToString(embedding);
            List<ExperienceKnowledgeBaseDocument> relevantExperiences =
                experienceKnowledgeBaseRepository.findSimilarDocuments(
                    embeddingString,
                    SIMILARITY_THRESHOLD,
                    MAX_EXPERIENCES
                );

            if (relevantExperiences.isEmpty()) {
                logger.warn("No relevant experiences found for query: {}", userMessage);
                return "I don't have enough information about experiences matching your request.";
            }

            logger.info("Found {} relevant experiences for query: {}", relevantExperiences.size(), userMessage);

            // Extract experience IDs
            List<Long> experienceIds = relevantExperiences.stream()
                .map(ExperienceKnowledgeBaseDocument::getSourceExperienceId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

            logger.info("Experience IDs: {}", experienceIds);

            // 3. Get routing data between experiences
            List<ItineraryDistanceMatrix> routes = new ArrayList<>();
            if (experienceIds.size() > 1) {
                routes = itineraryDistanceMatrixRepository.findRoutesBetweenExperiences(experienceIds);
            }

            // 4. Get availability data for next 30 days
            LocalDate startDate = LocalDate.now();
            LocalDate endDate = startDate.plusDays(30);
            List<ItineraryAvailabilityIndex> availabilities =
                itineraryAvailabilityIndexRepository.findByExperiencesAndDateRange(
                    experienceIds,
                    startDate,
                    endDate
                );

            // 5. Build context string
            context.append("=== ITINERARY PLANNING CONTEXT ===\n\n");

            // Add system instructions
            context.append("You are Trippy's AI Trip Planner. Your role is to:\n");
            context.append("- Create personalized day-by-day itineraries\n");
            context.append("- Consider travel time and transportation between activities\n");
            context.append("- Check availability and suggest optimal dates\n");
            context.append("- Balance experience variety and proximity\n");
            context.append("- Provide practical travel tips and recommendations\n\n");

            // Add available experiences
            context.append("=== AVAILABLE EXPERIENCES ===\n\n");
            for (ExperienceKnowledgeBaseDocument exp : relevantExperiences) {
                context.append(exp.getContentText()).append("\n\n");
            }

            // Add routing information
            if (!routes.isEmpty()) {
                context.append("=== TRANSPORTATION & ROUTING ===\n\n");
                for (ItineraryDistanceMatrix route : routes) {
                    context.append(formatRouteInfo(route)).append("\n\n");
                }
            }

            // Add availability information
            if (!availabilities.isEmpty()) {
                context.append("=== AVAILABILITY (Next 30 Days) ===\n\n");
                Map<Long, List<ItineraryAvailabilityIndex>> availByExperience = availabilities.stream()
                    .collect(Collectors.groupingBy(ItineraryAvailabilityIndex::getExperienceId));

                for (Map.Entry<Long, List<ItineraryAvailabilityIndex>> entry : availByExperience.entrySet()) {
                    context.append(formatAvailabilityInfo(entry.getKey(), entry.getValue())).append("\n");
                }
            }

            // Truncate if too long
            String fullContext = context.toString();
            if (fullContext.length() > MAX_CONTEXT_LENGTH) {
                fullContext = fullContext.substring(0, MAX_CONTEXT_LENGTH) + "\n... (context truncated)";
            }

            return fullContext;

        } catch (Exception e) {
            logger.error("Error building itinerary context: {}", e.getMessage(), e);
            return "I have limited information available right now. Please try rephrasing your request.";
        }
    }

    private String formatRouteInfo(ItineraryDistanceMatrix route) {
        StringBuilder sb = new StringBuilder();

        sb.append(String.format("Route: Experience #%d → Experience #%d\n",
            route.getOriginExperienceId(), route.getDestinationExperienceId()));

        if (route.getCountry() != null) {
            sb.append(String.format("Location: %s\n", route.getCountry()));
        }

        if (route.getStraightLineKm() != null) {
            sb.append(String.format("Distance: %.2f km (straight-line)\n", route.getStraightLineKm()));
        }

        // Driving info
        if (route.getDrivingDistanceKm() != null && route.getDrivingTimeMinutes() != null) {
            sb.append(String.format("🚗 Driving: %.2f km, %d minutes\n",
                route.getDrivingDistanceKm(), route.getDrivingTimeMinutes()));
        }

        // Transit info
        if (Boolean.TRUE.equals(route.getTransitAvailable()) &&
            route.getTransitDistanceKm() != null && route.getTransitTimeMinutes() != null) {
            sb.append(String.format("🚇 Public Transit: %.2f km, %d minutes\n",
                route.getTransitDistanceKm(), route.getTransitTimeMinutes()));
        }

        // Walking info
        if (Boolean.TRUE.equals(route.getWalkingFeasible()) &&
            route.getWalkingDistanceKm() != null && route.getWalkingTimeMinutes() != null) {
            sb.append(String.format("🚶 Walking: %.2f km, %d minutes\n",
                route.getWalkingDistanceKm(), route.getWalkingTimeMinutes()));
        }

        // Recommended mode
        if (route.getRecommendedMode() != null) {
            sb.append(String.format("Recommended: %s\n",
                route.getRecommendedMode().substring(0, 1).toUpperCase() +
                route.getRecommendedMode().substring(1)));
        }

        return sb.toString();
    }

    private String formatAvailabilityInfo(Long experienceId, List<ItineraryAvailabilityIndex> availabilities) {
        StringBuilder sb = new StringBuilder();

        sb.append(String.format("Experience #%d:\n", experienceId));

        long availableDays = availabilities.stream()
            .filter(a -> a.getAvailableSchedulesCount() > 0)
            .count();

        sb.append(String.format("- Available on %d days in next 30 days\n", availableDays));

        // Find days with high availability (low booking pressure)
        List<LocalDate> bestDates = availabilities.stream()
            .filter(a -> a.getAvailableSchedulesCount() > 0)
            .filter(a -> a.getBookingPressure() != null && a.getBookingPressure().doubleValue() < 50.0)
            .sorted(Comparator.comparing(ItineraryAvailabilityIndex::getBookingPressure))
            .limit(5)
            .map(ItineraryAvailabilityIndex::getScheduleDate)
            .collect(Collectors.toList());

        if (!bestDates.isEmpty()) {
            sb.append("- Best dates (low demand): ");
            sb.append(bestDates.stream()
                .map(LocalDate::toString)
                .collect(Collectors.joining(", ")));
            sb.append("\n");
        }

        return sb.toString();
    }

    private String convertEmbeddingToString(List<Double> embedding) {
        return "[" + embedding.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(",")) + "]";
    }

    public ChatbotSessionResponse getSessionHistory(String sessionId) {
        try {
            Optional<ChatbotSession> sessionOpt = chatbotSessionRepository.findBySessionId(sessionId);

            if (sessionOpt.isEmpty()) {
                logger.warn("Chat session not found: {}", sessionId);
                return null;
            }

            ChatbotSession session = sessionOpt.get();
            List<ChatbotMessage> messages = chatbotMessageRepository.findByChatbotSessionOrderByCreatedAtAsc(session);

            List<ChatbotSessionResponse.MessageHistory> messageHistory = messages.stream()
                .map(msg -> new ChatbotSessionResponse.MessageHistory(
                    msg.getUserMessage(),
                    msg.getBotResponse(),
                    msg.getCreatedAt()
                ))
                .collect(Collectors.toList());

            return new ChatbotSessionResponse(sessionId, messageHistory, session.getCreatedAt());

        } catch (Exception e) {
            logger.error("Error retrieving session history: {}", e.getMessage(), e);
            return null;
        }
    }

    public boolean deleteSession(String sessionId) {
        try {
            Optional<ChatbotSession> sessionOpt = chatbotSessionRepository.findBySessionId(sessionId);

            if (sessionOpt.isEmpty()) {
                logger.warn("Attempted to delete non-existent session: {}", sessionId);
                return false;
            }

            ChatbotSession session = sessionOpt.get();
            chatbotMessageRepository.deleteByChatbotSession(session);
            chatbotSessionRepository.delete(session);

            logger.info("Deleted itinerary chat session: {}", sessionId);
            return true;

        } catch (Exception e) {
            logger.error("Error deleting session: {}", e.getMessage(), e);
            return false;
        }
    }

    public List<ChatbotSession> getUserSessions(Long userId) {
        try {
            return chatbotSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        } catch (Exception e) {
            logger.error("Error retrieving user sessions: {}", e.getMessage(), e);
            return List.of();
        }
    }

    public List<String> getConversationStarters() {
        return Arrays.asList(
            "Plan a 3-day trip to Tokyo with cultural experiences",
            "What can I do in Paris in 2 days?",
            "Suggest outdoor activities near the Swiss Alps",
            "Create a food tour itinerary in Bangkok",
            "Plan a romantic weekend in Venice",
            "What are the best activities for families in Singapore?",
            "Design a 5-day adventure trip in New Zealand",
            "Recommend water activities in the Maldives"
        );
    }

    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();

        try {
            Long experienceCount = experienceKnowledgeBaseRepository.countTotalDocuments();
            Long routeCount = itineraryDistanceMatrixRepository.count();
            Long availabilityCount = itineraryAvailabilityIndexRepository.count();

            health.put("status", "healthy");
            health.put("experienceDocuments", experienceCount);
            health.put("routingData", routeCount);
            health.put("availabilityRecords", availabilityCount);
            health.put("timestamp", LocalDateTime.now());

        } catch (Exception e) {
            logger.error("Health check failed: {}", e.getMessage(), e);
            health.put("status", "unhealthy");
            health.put("error", e.getMessage());
        }

        return health;
    }

    private ChatbotSession getOrCreateSession(String sessionId, Long userId) {
        if (sessionId != null && !sessionId.trim().isEmpty()) {
            Optional<ChatbotSession> existingSession = chatbotSessionRepository.findBySessionId(sessionId);
            if (existingSession.isPresent()) {
                return existingSession.get();
            }
        }

        // Create new session
        String newSessionId = sessionId != null ? sessionId : generateSessionId();
        ChatbotSession newSession = new ChatbotSession(newSessionId, userId);
        return chatbotSessionRepository.save(newSession);
    }

    private ChatbotMessage saveChatMessage(ChatbotSession session, String userMessage, String botResponse, String sources) {
        ChatbotMessage chatbotMessage = new ChatbotMessage(session, userMessage);
        chatbotMessage.setBotResponse(botResponse);
        chatbotMessage.setSources(sources);
        return chatbotMessageRepository.save(chatbotMessage);
    }

    private String generateSessionId() {
        return "itinerary_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
