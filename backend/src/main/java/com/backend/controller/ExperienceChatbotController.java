package com.backend.controller;

import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.ChatbotSession;
import com.backend.service.ExperienceChatbotService;
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
@RequestMapping("/api/experience-chatbot")
public class ExperienceChatbotController {

    private static final Logger logger = LoggerFactory.getLogger(ExperienceChatbotController.class);

    @Autowired
    private ExperienceChatbotService experienceChatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatbotMessageResponse> sendMessage(
            @Valid @RequestBody ChatbotMessageRequest request,
            @RequestHeader(value = "User-ID") Long userId) {
        
        try {
            logger.info("Processing chat message for user: {}, session: {}", userId, request.getSessionId());
            
            ChatbotMessageResponse response = experienceChatbotService.processMessage(request, userId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing chat message: {}", e.getMessage(), e);
            
            ChatbotMessageResponse errorResponse = new ChatbotMessageResponse(
                "I'm sorry, I encountered an error processing your request. Please try again.",
                request.getSessionId()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatbotSessionResponse> getSessionHistory(@PathVariable String sessionId) {
        try {
            logger.info("Retrieving session history for: {}", sessionId);
            
            ChatbotSessionResponse sessionResponse = experienceChatbotService.getSessionHistory(sessionId);
            
            if (sessionResponse == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(sessionResponse);
            
        } catch (Exception e) {
            logger.error("Error retrieving session history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(@RequestHeader(value = "User-ID") Long userId) {
        try {
            logger.info("Creating new experience chatbot session for user: {}", userId);
            
            // Use the service's getOrCreateSession method which handles session ID generation
            ChatbotSession session = experienceChatbotService.getOrCreateSession(null, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getSessionId());
            response.put("userId", session.getUserId());
            response.put("createdAt", session.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating experience chatbot session: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error creating session");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteSession(@PathVariable String sessionId) {
        try {
            logger.info("Deleting session: {}", sessionId);
            
            boolean deleted = experienceChatbotService.deleteSession(sessionId);
            
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
            logger.error("Error deleting session: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error deleting session");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/users/{userId}/sessions")
    public ResponseEntity<List<ChatbotSession>> getUserSessions(@PathVariable Long userId) {
        try {
            logger.info("Retrieving sessions for user: {}", userId);
            
            List<ChatbotSession> sessions = experienceChatbotService.getUserSessions(userId);
            
            return ResponseEntity.ok(sessions);
            
        } catch (Exception e) {
            logger.error("Error retrieving user sessions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("service", "Experience Chatbot");
            
            Long knowledgeBaseCount = experienceChatbotService.getKnowledgeBaseHealth();
            health.put("knowledgeBaseDocuments", knowledgeBaseCount);
            
            if (knowledgeBaseCount > 0) {
                health.put("knowledgeBaseStatus", "READY");
            } else {
                health.put("knowledgeBaseStatus", "NO_DATA");
            }
            
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            logger.error("Error checking health status: {}", e.getMessage(), e);
            
            Map<String, Object> errorHealth = new HashMap<>();
            errorHealth.put("status", "DOWN");
            errorHealth.put("error", "Health check failed");
            
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorHealth);
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getConversationSuggestions() {
        try {
            Map<String, Object> response = new HashMap<>();
            
            List<String> suggestions = List.of(
                "What are the best adventure experiences in Paris?",
                "I'm looking for family-friendly activities in Tokyo",
                "Show me unique cultural experiences in Bali",
                "What outdoor activities do you recommend for couples?",
                "Find me food tours in Italy under $100",
                "What are the top-rated experiences near me?"
            );
            
            response.put("suggestions", suggestions);
            response.put("categories", List.of("Adventure", "Cultural", "Food & Drink", "Family", "Romantic", "Outdoor"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting suggestions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}