package com.backend.service;

import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.FAQChatbotMessage;
import com.backend.entity.FAQChatbotSession;
import com.backend.entity.FAQKnowledgeBase;
import com.backend.repository.FAQChatbotMessageRepository;
import com.backend.repository.FAQChatbotSessionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FAQChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(FAQChatbotService.class);

    @Autowired
    private FAQChatbotSessionRepository faqChatbotSessionRepository;

    @Autowired
    private FAQChatbotMessageRepository faqChatbotMessageRepository;

    @Autowired
    private FAQKnowledgeBaseService faqKnowledgeBaseService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String NO_MATCH_MESSAGE = "I couldn't find a similar question in our FAQ. Please rephrase your question or visit our [FAQ page](/faq) for more information. You can also submit a [support ticket](/support) to ask a question.";

    public ChatbotMessageResponse processMessage(ChatbotMessageRequest request, Long userId) {
        try {
            // Get or create chat session
            FAQChatbotSession session = getOrCreateSession(request.getSessionId(), userId);

            // Search knowledge base for similar FAQs
            List<FAQKnowledgeBase> similarFAQs = faqKnowledgeBaseService.searchSimilarFAQs(request.getMessage());

            String botResponse;
            List<ChatbotMessageResponse.SourceDocument> sources = new ArrayList<>();

            if (similarFAQs.isEmpty()) {
                // No similar FAQ found
                botResponse = NO_MATCH_MESSAGE;
            } else {
                // Return the content from the most similar FAQ, formatted with Question and Answer
                FAQKnowledgeBase mostSimilarFAQ = similarFAQs.get(0);
                botResponse = formatFAQResponse(mostSimilarFAQ.getContent());
                
                // Build sources list
                sources = similarFAQs.stream()
                    .map(faq -> new ChatbotMessageResponse.SourceDocument(
                        String.valueOf(faq.getKnowledgeId()),
                        faq.getCategory() != null ? faq.getCategory() : "FAQ",
                        "faq",
                        null // No relevance score for TF-IDF
                    ))
                    .collect(Collectors.toList());
            }

            // Save the conversation
            FAQChatbotMessage chatbotMessage = saveChatMessage(session, request.getMessage(), botResponse, sources);

            // Build response
            ChatbotMessageResponse response = new ChatbotMessageResponse(botResponse, session.getSessionId());
            response.setSources(sources);
            response.setTimestamp(chatbotMessage.getCreatedAt());

            logger.info("Processed FAQ chat message for session: {}", session.getSessionId());
            return response;

        } catch (Exception e) {
            logger.error("Error processing FAQ chat message: {}", e.getMessage(), e);
            return new ChatbotMessageResponse(
                "I'm sorry, I encountered an error processing your request. Please try again.",
                request.getSessionId() != null ? request.getSessionId() : generateSessionId()
            );
        }
    }

    public ChatbotSessionResponse getSessionHistory(String sessionId) {
        try {
            Optional<FAQChatbotSession> sessionOpt = faqChatbotSessionRepository.findBySessionId(sessionId);
            
            if (sessionOpt.isEmpty()) {
                logger.warn("FAQ chat session not found: {}", sessionId);
                return null;
            }

            FAQChatbotSession session = sessionOpt.get();
            List<FAQChatbotMessage> messages = faqChatbotMessageRepository.findByFaqChatbotSessionOrderByCreatedAtAsc(session);

            List<ChatbotSessionResponse.MessageHistory> messageHistory = messages.stream()
                .map(msg -> new ChatbotSessionResponse.MessageHistory(
                    msg.getUserMessage(),
                    msg.getBotResponse(),
                    msg.getCreatedAt()
                ))
                .collect(Collectors.toList());

            return new ChatbotSessionResponse(sessionId, messageHistory, session.getCreatedAt());

        } catch (Exception e) {
            logger.error("Error retrieving FAQ session history: {}", e.getMessage(), e);
            return null;
        }
    }

    public boolean deleteSession(String sessionId) {
        try {
            Optional<FAQChatbotSession> sessionOpt = faqChatbotSessionRepository.findBySessionId(sessionId);
            
            if (sessionOpt.isEmpty()) {
                logger.warn("Attempted to delete non-existent FAQ session: {}", sessionId);
                return false;
            }

            FAQChatbotSession session = sessionOpt.get();
            faqChatbotMessageRepository.deleteByFaqChatbotSession(session);
            faqChatbotSessionRepository.delete(session);

            logger.info("Deleted FAQ chat session: {}", sessionId);
            return true;

        } catch (Exception e) {
            logger.error("Error deleting FAQ session: {}", e.getMessage(), e);
            return false;
        }
    }

    public List<FAQChatbotSession> getUserSessions(Long userId) {
        try {
            return faqChatbotSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        } catch (Exception e) {
            logger.error("Error retrieving user FAQ sessions: {}", e.getMessage(), e);
            return List.of();
        }
    }

    public FAQChatbotSession getOrCreateLatestSession(Long userId) {
        // Try to get the most recent session for this user
        List<FAQChatbotSession> userSessions = faqChatbotSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        
        if (!userSessions.isEmpty()) {
            // Return the most recent session
            return userSessions.get(0);
        }
        
        // No existing session, create a new one
        String newSessionId = generateSessionId();
        FAQChatbotSession newSession = new FAQChatbotSession(newSessionId, userId);
        return faqChatbotSessionRepository.save(newSession);
    }

    public FAQChatbotSession getOrCreateSession(String sessionId, Long userId) {
        if (sessionId != null && !sessionId.trim().isEmpty()) {
            Optional<FAQChatbotSession> existingSession = faqChatbotSessionRepository.findBySessionId(sessionId);
            if (existingSession.isPresent()) {
                return existingSession.get();
            }
        }

        // Create new session
        String newSessionId = sessionId != null ? sessionId : generateSessionId();
        FAQChatbotSession newSession = new FAQChatbotSession(newSessionId, userId);
        return faqChatbotSessionRepository.save(newSession);
    }

    private FAQChatbotMessage saveChatMessage(FAQChatbotSession session, String userMessage, String botResponse, List<ChatbotMessageResponse.SourceDocument> sources) {
        FAQChatbotMessage chatbotMessage = new FAQChatbotMessage(session, userMessage);
        chatbotMessage.setBotResponse(botResponse);

        // Save sources as JSON
        try {
            String sourcesJson = objectMapper.writeValueAsString(sources);
            chatbotMessage.setSources(sourcesJson);
        } catch (JsonProcessingException e) {
            logger.error("Error serializing sources: {}", e.getMessage());
            chatbotMessage.setSources("[]");
        }

        return faqChatbotMessageRepository.save(chatbotMessage);
    }

    private String generateSessionId() {
        return "faq_chat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
    
    /**
     * Parse FAQ content and format it as Question: ... Answer: ...
     */
    private String formatFAQResponse(String content) {
        if (content == null || content.trim().isEmpty()) {
            return content;
        }
        
        // Try to split on question marks, periods, or exclamation marks
        // The first sentence is typically the question
        String[] sentences = content.split("[.!?]+", 2);
        
        if (sentences.length >= 2) {
            String question = sentences[0].trim();
            String answer = sentences[1].trim();
            
            // If question ends with ?, remove it for cleaner display
            if (question.endsWith("?")) {
                question = question.substring(0, question.length() - 1).trim();
            }
            
            return "**Question:** " + question + "\n\n**Answer:** " + answer;
        } else if (sentences.length == 1) {
            // If no clear separator, try to find first sentence
            String text = sentences[0].trim();
            // Look for common question patterns
            if (text.matches("(?i).*\\b(what|how|when|where|who|why|can|do|does|is|are|will|would|should|could)\\b.*\\?.*")) {
                // Contains question pattern, try to split on question mark
                int questionMarkIndex = text.indexOf('?');
                if (questionMarkIndex > 0 && questionMarkIndex < text.length() - 1) {
                    String question = text.substring(0, questionMarkIndex).trim();
                    String answer = text.substring(questionMarkIndex + 1).trim();
                    return "**Question:** " + question + "\n\n**Answer:** " + answer;
                }
            }
            // If no clear question/answer split, just return as answer
            return "**Answer:** " + text;
        }
        
        return content;
    }
}

