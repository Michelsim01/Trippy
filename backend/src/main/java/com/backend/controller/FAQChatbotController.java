package com.backend.controller;

import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.FAQChatbotSession;
import com.backend.service.FAQChatbotService;
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
@RequestMapping("/api/faq-chatbot")
public class FAQChatbotController {

    private static final Logger logger = LoggerFactory.getLogger(FAQChatbotController.class);

    @Autowired
    private FAQChatbotService faqChatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatbotMessageResponse> sendMessage(
            @Valid @RequestBody ChatbotMessageRequest request,
            @RequestHeader(value = "User-ID") Long userId) {
        
        try {
            logger.info("Processing FAQ chat message for user: {}, session: {}", userId, request.getSessionId());
            
            ChatbotMessageResponse response = faqChatbotService.processMessage(request, userId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing FAQ chat message: {}", e.getMessage(), e);
            
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
            logger.info("Retrieving FAQ session history for: {}", sessionId);
            
            ChatbotSessionResponse sessionResponse = faqChatbotService.getSessionHistory(sessionId);
            
            if (sessionResponse == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(sessionResponse);
            
        } catch (Exception e) {
            logger.error("Error retrieving FAQ session history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(@RequestHeader(value = "User-ID") Long userId) {
        try {
            logger.info("Getting or creating FAQ session for user: {}", userId);
            
            // Get or create the most recent session for this user
            FAQChatbotSession session = faqChatbotService.getOrCreateLatestSession(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getSessionId());
            response.put("userId", session.getUserId());
            response.put("createdAt", session.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting/creating FAQ session: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error getting/creating session");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/users/{userId}/latest-session")
    public ResponseEntity<Map<String, Object>> getLatestSession(@PathVariable Long userId) {
        try {
            logger.info("Getting latest FAQ session for user: {}", userId);
            
            FAQChatbotSession session = faqChatbotService.getOrCreateLatestSession(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getSessionId());
            response.put("userId", session.getUserId());
            response.put("createdAt", session.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting latest FAQ session: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error getting latest session");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ChatbotSessionResponse> getMessages(@PathVariable String sessionId) {
        // Same as getSessionHistory
        return getSessionHistory(sessionId);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteSession(@PathVariable String sessionId) {
        try {
            logger.info("Deleting FAQ session: {}", sessionId);
            
            boolean deleted = faqChatbotService.deleteSession(sessionId);
            
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
            logger.error("Error deleting FAQ session: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error deleting session");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/users/{userId}/sessions")
    public ResponseEntity<List<FAQChatbotSession>> getUserSessions(@PathVariable Long userId) {
        try {
            logger.info("Retrieving FAQ sessions for user: {}", userId);
            
            List<FAQChatbotSession> sessions = faqChatbotService.getUserSessions(userId);
            
            return ResponseEntity.ok(sessions);
            
        } catch (Exception e) {
            logger.error("Error retrieving user FAQ sessions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

