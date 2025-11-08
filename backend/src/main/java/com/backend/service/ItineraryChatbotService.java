package com.backend.service;

import com.backend.dto.QueryParams;
import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.*;
import com.backend.repository.*;
import com.backend.util.QueryParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private OpenAIService openAIService;

    @Value("${chatbot.max.results}")
    private Integer maxExperiences;

    @Value("${chatbot.max.context.length}")
    private Integer maxContextLength;

    @Value("${chatbot.similarity.threshold}")
    private Double similarityThreshold;

    public ChatbotMessageResponse processMessage(ChatbotMessageRequest request, Long userId) {
        try {
            // Get or create chat session
            ChatbotSession session = getOrCreateSession(request.getSessionId(), userId);

            // Retrieve conversation history for this session (excluding current message)
            List<ChatbotMessage> conversationHistory = session.getMessages();
            logger.info("Retrieved conversation history: {} previous messages", conversationHistory.size());

            // Build comprehensive context for itinerary planning
            String context = buildItineraryContext(request.getMessage());

            logger.info("Built context for itinerary planning (length: {})", context.length());
            logger.debug("Context content: {}", context);

            // Generate AI response with itinerary planning context AND conversation history
            logger.info("Calling OpenAI with message length: {}, context length: {}, conversation history: {} messages",
                request.getMessage().length(), context.length(), conversationHistory.size());
            String botResponse = openAIService.generateChatResponse(request.getMessage(), context, conversationHistory);

            logger.info("Received OpenAI response - length: {} characters", botResponse.length());
            logger.info("Response ends with: '{}'",
                botResponse.length() > 200 ? botResponse.substring(botResponse.length() - 200) : botResponse);

            // Check if response appears truncated
            if (botResponse.contains("Stay tuned") || botResponse.contains("Coming up next") ||
                botResponse.contains("Day 2 and Day 3")) {
                logger.warn("⚠️ RESPONSE APPEARS INTENTIONALLY SPLIT - AI is teasing future content!");
            }

            // Save the conversation
            ChatbotMessage chatbotMessage = saveChatMessage(session, request.getMessage(), botResponse, "[]");
            logger.info("Saved message to database - bot_response length: {}", botResponse.length());

            // Build response
            ChatbotMessageResponse response = new ChatbotMessageResponse(botResponse, session.getSessionId());
            response.setTimestamp(chatbotMessage.getCreatedAt());
            logger.info("Returning response to frontend - length: {}", response.getResponse().length());

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
            // 0. Parse query parameters
            QueryParams params = QueryParser.parse(userMessage);
            logger.info("Parsed query params: {}", params);

            // 1. Generate embedding for user query
            List<Double> embedding = openAIService.generateEmbedding(userMessage);

            if (embedding == null) {
                logger.warn("Failed to generate embedding for query: {}", userMessage);
                return "I'm having trouble understanding your request. Please try rephrasing.";
            }

            // 2. Search for relevant experiences using vector similarity with optional location filtering
            String embeddingString = convertEmbeddingToString(embedding);
            List<ExperienceKnowledgeBaseDocument> relevantExperiences;

            if (params.getDestination() != null && !params.getDestination().isEmpty()) {
                // Use SQL-based location filtering for better performance
                logger.info("🔍 Executing location-filtered query:");
                logger.info("   Destination: '{}'", params.getDestination());
                logger.info("   Similarity threshold: {}", similarityThreshold);
                logger.info("   Max experiences: {}", maxExperiences);
                logger.info("   SQL will search: metadata->>'location' ILIKE '%{}%' OR metadata->>'country' ILIKE '%{}%'",
                    params.getDestination(), params.getDestination());

                // Fetch more docs since we'll filter out logistics
                relevantExperiences = experienceKnowledgeBaseRepository.findSimilarDocumentsByLocation(
                    embeddingString,
                    params.getDestination(),
                    similarityThreshold,
                    maxExperiences * 3
                );

                // Filter out logistics documents (workaround for repository query not working)
                int beforeFilter = relevantExperiences.size();

                logger.info("DEBUG: Before filter, first 3 docs:");
                relevantExperiences.stream().limit(3).forEach(doc ->
                    logger.info("  - ID: {}, Type: '{}'", doc.getDocumentId(), doc.getDocumentType())
                );

                relevantExperiences = relevantExperiences.stream()
                    .filter(doc -> {
                        boolean keep = !"itinerary_logistics".equals(doc.getDocumentType());
                        if (!keep) {
                            logger.debug("FILTERING OUT: {} (type: {})", doc.getDocumentId(), doc.getDocumentType());
                        }
                        return keep;
                    })
                    .limit(maxExperiences)
                    .collect(Collectors.toList());

                logger.info("DEBUG: After filter, first 3 docs:");
                relevantExperiences.stream().limit(3).forEach(doc ->
                    logger.info("  - ID: {}, Type: '{}'", doc.getDocumentId(), doc.getDocumentType())
                );

                logger.info("🔧 Filtered: {} total docs → {} logistics removed → {} experience docs kept",
                    beforeFilter, beforeFilter - relevantExperiences.size(), relevantExperiences.size());

                logger.info("✅ Found {} relevant experiences for destination '{}' using SQL filtering",
                    relevantExperiences.size(), params.getDestination());

                if (relevantExperiences.isEmpty()) {
                    logger.warn("⚠️  No experiences matched location filter for '{}'", params.getDestination());
                    logger.warn("   This could mean:");
                    logger.warn("   1. No experiences have metadata->>'location' or metadata->>'country' matching '{}'", params.getDestination());
                    logger.warn("   2. Similarity threshold {} is too strict", similarityThreshold);
                    logger.warn("   3. Embedding similarity is below threshold for all experiences in this location");
                }
            } else {
                // No destination specified, search globally
                logger.info("🔍 Executing global query (no location filter)");
                relevantExperiences = experienceKnowledgeBaseRepository.findSimilarDocuments(
                    embeddingString,
                    similarityThreshold,
                    maxExperiences * 3
                );

                // Filter out logistics documents
                int beforeFilter = relevantExperiences.size();
                relevantExperiences = relevantExperiences.stream()
                    .filter(doc -> !"logistics".equals(doc.getDocumentType()))
                    .limit(maxExperiences)
                    .collect(Collectors.toList());

                logger.info("🔧 Filtered: {} total docs → {} logistics removed → {} experience docs kept",
                    beforeFilter, beforeFilter - relevantExperiences.size(), relevantExperiences.size());

                logger.info("✅ Found {} relevant experiences (no location filter)", relevantExperiences.size());
            }

            if (relevantExperiences.isEmpty()) {
                if (params.getDestination() != null) {
                    return String.format("I couldn't find any experiences in %s. Could you try a different destination or be more specific?",
                        params.getDestination());
                } else {
                    return "I don't have enough information about experiences matching your request.";
                }
            }

            // Extract experience IDs and create ID-to-title mapping
            logger.info("🔍 Extracting experience IDs from {} knowledge base documents:", relevantExperiences.size());
            for (ExperienceKnowledgeBaseDocument doc : relevantExperiences) {
                logger.info("   Document ID: {}, sourceExperienceId: {}, title: {}",
                    doc.getDocumentId(),
                    doc.getSourceExperienceId(),
                    doc.getTitle());
            }

            List<Long> experienceIds = relevantExperiences.stream()
                .map(ExperienceKnowledgeBaseDocument::getSourceExperienceId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

            // Create mapping from experience ID to experience title
            Map<Long, String> experienceIdToTitle = relevantExperiences.stream()
                .filter(exp -> exp.getSourceExperienceId() != null && exp.getTitle() != null)
                .collect(Collectors.toMap(
                    ExperienceKnowledgeBaseDocument::getSourceExperienceId,
                    ExperienceKnowledgeBaseDocument::getTitle,
                    (existing, replacement) -> existing  // Keep first title if duplicates
                ));

            logger.info("Experience IDs: {}", experienceIds);

            // 3. Get routing data between experiences
            List<ItineraryDistanceMatrix> routes = new ArrayList<>();
            if (experienceIds.size() > 1) {
                routes = itineraryDistanceMatrixRepository.findRoutesBetweenExperiences(experienceIds);
            }

            // 4. Calculate trip date range from user query FIRST
            LocalDate tripStartDate;
            if (params.getStartDate() != null) {
                tripStartDate = params.getStartDate();
            } else {
                // Default: start 7 days from now (reasonable booking lead time)
                tripStartDate = LocalDate.now().plusDays(7);
            }

            int tripDuration = params.getTripDuration() != null ? params.getTripDuration() : 3;
            // Trip end date should be start + (duration - 1)
            // Example: 3-day trip from Nov 19 = Day 1 (Nov 19), Day 2 (Nov 20), Day 3 (Nov 21)
            LocalDate tripEndDate = tripStartDate.plusDays(tripDuration - 1);

            // 5. Get availability data for EXACT TRIP DATE RANGE ONLY
            // No buffer - we want strict date matching to prevent AI from assigning wrong dates
            LocalDate availabilityStart = tripStartDate;
            LocalDate availabilityEnd = tripEndDate;

            logger.info("Fetching availability for exact trip dates {} to {}",
                tripStartDate, tripEndDate);

            List<ItineraryAvailabilityIndex> availabilities =
                itineraryAvailabilityIndexRepository.findByExperiencesAndDateRange(
                    experienceIds,
                    availabilityStart,
                    availabilityEnd
                );

            // Fetch actual schedules with times
            List<ExperienceSchedule> schedules =
                experienceScheduleRepository.findAvailableSchedulesByExperiencesAndDateRange(
                    experienceIds,
                    availabilityStart,
                    availabilityEnd
                );

            logger.info("📅 Fetched {} schedule records with actual times", schedules.size());

            // 6. Build context string
            context.append("=== ITINERARY PLANNING CONTEXT ===\n\n");

            // Add trip details
            context.append("=== USER TRIP DETAILS ===\n");
            context.append(String.format("Trip Start Date: %s\n",
                tripStartDate.format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"))));
            context.append(String.format("Trip End Date: %s\n",
                tripEndDate.format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"))));
            context.append(String.format("Duration: %d days\n", tripDuration));
            if (params.getDestination() != null) {
                context.append(String.format("Destination: %s\n", params.getDestination()));
            }
            if (params.getDepartureCity() != null) {
                context.append(String.format("Departing From: %s\n", params.getDepartureCity()));
            }
            if (params.getMaxBudget() != null) {
                context.append(String.format("Budget: $%s per person\n", params.getMaxBudget()));
            }
            context.append("\n");

            // Add system instructions
            context.append("You are Trippy's AI Trip Planner. Your role is to:\n");
            context.append("- Create personalized day-by-day itineraries\n");
            context.append("- Consider travel time and transportation between activities\n");
            context.append("- Check availability and suggest optimal dates\n");
            context.append("- Balance experience variety and proximity\n");
            context.append("- Provide practical travel tips and recommendations\n\n");

            // Add availability information FIRST (most critical - must not be truncated!)
            if (!availabilities.isEmpty()) {
                logger.info("📅 Total availability records found: {}", availabilities.size());

                // Log each availability record for debugging
                for (ItineraryAvailabilityIndex avail : availabilities) {
                    logger.info("  Experience #{}: scheduleDate={}, availableCount={}, bookingPressure={}",
                        avail.getExperienceId(),
                        avail.getScheduleDate(),
                        avail.getAvailableSchedulesCount(),
                        avail.getBookingPressure());
                }

                context.append("=== AVAILABILITY (Exact Trip Dates Only) ===\n\n");
                Map<Long, List<ItineraryAvailabilityIndex>> availByExperience = availabilities.stream()
                    .collect(Collectors.groupingBy(ItineraryAvailabilityIndex::getExperienceId));

                // Group schedules by experience
                Map<Long, List<ExperienceSchedule>> schedulesByExperience = schedules.stream()
                    .collect(Collectors.groupingBy(schedule -> schedule.getExperience().getExperienceId()));

                for (Map.Entry<Long, List<ItineraryAvailabilityIndex>> entry : availByExperience.entrySet()) {
                    List<ExperienceSchedule> experienceSchedules = schedulesByExperience.getOrDefault(entry.getKey(), new ArrayList<>());
                    String formattedAvail = formatAvailabilityInfo(entry.getKey(), entry.getValue(), experienceSchedules, experienceIdToTitle);
                    logger.info("📋 Availability info for Experience #{}: {}", entry.getKey(), formattedAvail);
                    context.append(formattedAvail).append("\n");
                }
            } else {
                logger.warn("⚠️  No availability records found for trip dates {} to {}", availabilityStart, availabilityEnd);
                context.append("=== AVAILABILITY ===\n\n");
                context.append("⚠️  No Trippy experiences have availability during the requested trip dates.\n");
                context.append("Please create an itinerary using web-based activities and attractions.\n\n");
            }

            // Add available experiences (ONLY those with availability during trip dates!)
            // Get set of experience IDs that have availability
            Set<Long> experiencesWithAvailability = availabilities.stream()
                .map(ItineraryAvailabilityIndex::getExperienceId)
                .collect(Collectors.toSet());

            // Filter experiences to only include those with availability
            List<ExperienceKnowledgeBaseDocument> experiencesWithAvailabilityDocs = relevantExperiences.stream()
                .filter(exp -> exp.getSourceExperienceId() != null &&
                              experiencesWithAvailability.contains(exp.getSourceExperienceId()))
                .collect(Collectors.toList());

            logger.info("📋 Experiences with availability: {}/{} experiences have availability during trip dates",
                experiencesWithAvailabilityDocs.size(), relevantExperiences.size());

            context.append("=== AVAILABLE EXPERIENCES ===\n\n");
            if (!experiencesWithAvailabilityDocs.isEmpty()) {
                for (ExperienceKnowledgeBaseDocument exp : experiencesWithAvailabilityDocs) {
                    context.append(exp.getContentText()).append("\n\n");
                }
            } else {
                context.append("⚠️  No Trippy experiences have availability during your requested trip dates.\n");
                context.append("The itinerary below will include web-based activities and attractions instead.\n\n");
            }

            // Add routing information (can be truncated if needed)
            if (!routes.isEmpty()) {
                context.append("=== TRANSPORTATION & ROUTING ===\n\n");
                for (ItineraryDistanceMatrix route : routes) {
                    context.append(formatRouteInfo(route)).append("\n\n");
                }
            }

            // Truncate if too long
            String fullContext = context.toString();
            if (fullContext.length() > maxContextLength) {
                logger.warn("⚠️  Context length {} exceeds max {}, truncating", fullContext.length(), maxContextLength);
                fullContext = fullContext.substring(0, maxContextLength) + "\n... (context truncated)";
            }

            // Log the complete AVAILABILITY section that AI will see
            int availSectionStart = fullContext.indexOf("=== AVAILABILITY");
            int availSectionEnd = fullContext.indexOf("\n\n===", availSectionStart + 10);
            if (availSectionStart != -1) {
                String availSection = availSectionEnd != -1
                    ? fullContext.substring(availSectionStart, availSectionEnd)
                    : fullContext.substring(availSectionStart);
                logger.info("🤖 AI will see this AVAILABILITY section:\n{}", availSection);
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

    private String formatAvailabilityInfo(Long experienceId, List<ItineraryAvailabilityIndex> availabilities,
                                         List<ExperienceSchedule> schedules, Map<Long, String> experienceIdToTitle) {
        StringBuilder sb = new StringBuilder();

        // Include experience title if available
        String experienceTitle = experienceIdToTitle.get(experienceId);
        if (experienceTitle != null) {
            sb.append(String.format("Experience #%d (%s):\n", experienceId, experienceTitle));
        } else {
            sb.append(String.format("Experience #%d:\n", experienceId));
        }

        // Group schedules by date
        Map<LocalDate, List<ExperienceSchedule>> schedulesByDate = schedules.stream()
            .collect(Collectors.groupingBy(schedule -> schedule.getStartDateTime().toLocalDate()));

        // Get ALL available dates (where availableSchedulesCount > 0)
        List<LocalDate> availableDates = availabilities.stream()
            .filter(a -> a.getAvailableSchedulesCount() > 0)
            .map(ItineraryAvailabilityIndex::getScheduleDate)
            .sorted()
            .collect(Collectors.toList());

        if (availableDates.isEmpty()) {
            sb.append("- ❌ NO AVAILABILITY during trip dates\n");
            sb.append("- DO NOT include this experience in the itinerary\n");
            sb.append("- Use web-based alternatives instead\n");
        } else {
            sb.append(String.format("- ✅ Available on %d dates with schedules:\n", availableDates.size()));

            // Show each date with its schedule times
            for (LocalDate date : availableDates) {
                List<ExperienceSchedule> dateSchedules = schedulesByDate.getOrDefault(date, new ArrayList<>());
                sb.append(String.format("  %s:\n", date.format(java.time.format.DateTimeFormatter.ofPattern("MMM d, yyyy"))));

                if (dateSchedules.isEmpty()) {
                    sb.append("    (Schedule times not available)\n");
                } else {
                    for (ExperienceSchedule schedule : dateSchedules) {
                        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("h:mm a");
                        String startTime = schedule.getStartDateTime().format(timeFormatter);
                        String endTime = schedule.getEndDateTime().format(timeFormatter);
                        sb.append(String.format("    %s to %s (%d spots available)\n",
                            startTime, endTime, schedule.getAvailableSpots()));
                    }
                }
            }

            sb.append("- ⚠️  ONLY assign this experience to dates listed above\n");
            sb.append("- ⚠️  ONLY use the schedule times shown for each date\n");

            // Highlight best dates (low booking pressure) if available
            List<LocalDate> bestDates = availabilities.stream()
                .filter(a -> a.getAvailableSchedulesCount() > 0)
                .filter(a -> a.getBookingPressure() != null && a.getBookingPressure().doubleValue() < 50.0)
                .sorted(Comparator.comparing(ItineraryAvailabilityIndex::getBookingPressure))
                .limit(3)
                .map(ItineraryAvailabilityIndex::getScheduleDate)
                .collect(Collectors.toList());

            if (!bestDates.isEmpty()) {
                sb.append("- 💡 Best dates (low demand): ");
                sb.append(bestDates.stream()
                    .map(date -> date.format(java.time.format.DateTimeFormatter.ofPattern("MMM d, yyyy")))
                    .collect(Collectors.joining(", ")));
                sb.append("\n");
            }
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
