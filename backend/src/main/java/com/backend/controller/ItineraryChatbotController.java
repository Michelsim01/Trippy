package com.backend.controller;

import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.ChatbotSession;
import com.backend.service.ItineraryChatbotService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/itinerary-chatbot")
public class ItineraryChatbotController {

    private static final Logger logger = LoggerFactory.getLogger(ItineraryChatbotController.class);

    @Autowired
    private ItineraryChatbotService itineraryChatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatbotMessageResponse> sendMessage(
            @Valid @RequestBody ChatbotMessageRequest request,
            @RequestHeader(value = "User-ID") Long userId) {

        try {
            logger.info("Processing itinerary chat message for user: {}, session: {}", userId, request.getSessionId());

            ChatbotMessageResponse response = itineraryChatbotService.processMessage(request, userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error processing itinerary chat message: {}", e.getMessage(), e);

            ChatbotMessageResponse errorResponse = new ChatbotMessageResponse(
                "I'm sorry, I encountered an error planning your itinerary. Please try again.",
                request.getSessionId()
            );

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatbotSessionResponse> getSessionHistory(@PathVariable String sessionId) {
        try {
            logger.info("Retrieving itinerary session history for: {}", sessionId);

            ChatbotSessionResponse sessionResponse = itineraryChatbotService.getSessionHistory(sessionId);

            if (sessionResponse == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(sessionResponse);

        } catch (Exception e) {
            logger.error("Error retrieving itinerary session history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteSession(@PathVariable String sessionId) {
        try {
            logger.info("Deleting itinerary session: {}", sessionId);

            boolean deleted = itineraryChatbotService.deleteSession(sessionId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", deleted);
            response.put("sessionId", sessionId);

            if (deleted) {
                response.put("message", "Session deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Session not found");
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            logger.error("Error deleting itinerary session: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error deleting session");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/users/{userId}/sessions")
    public ResponseEntity<List<ChatbotSession>> getUserSessions(@PathVariable Long userId) {
        try {
            logger.info("Retrieving itinerary sessions for user: {}", userId);

            List<ChatbotSession> sessions = itineraryChatbotService.getUserSessions(userId);

            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            logger.error("Error retrieving user itinerary sessions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        try {
            Map<String, Object> health = itineraryChatbotService.getHealthStatus();
            return ResponseEntity.ok(health);

        } catch (Exception e) {
            logger.error("Error checking itinerary chatbot health: {}", e.getMessage(), e);

            Map<String, Object> errorHealth = new HashMap<>();
            errorHealth.put("status", "unhealthy");
            errorHealth.put("error", "Health check failed: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorHealth);
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getConversationSuggestions() {
        try {
            List<String> suggestions = itineraryChatbotService.getConversationStarters();

            Map<String, Object> response = new HashMap<>();
            response.put("suggestions", suggestions);
            response.put("categories", List.of("Multi-day Trips", "Day Trips", "Activities", "Food & Culture", "Adventure", "Romantic"));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting itinerary suggestions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
