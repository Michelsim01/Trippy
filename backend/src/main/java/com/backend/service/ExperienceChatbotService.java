package com.backend.service;

import com.backend.dto.request.ChatMessageRequest;
import com.backend.dto.response.ChatMessageResponse;
import com.backend.dto.response.ChatSessionResponse;
import com.backend.entity.ChatbotMessage;
import com.backend.entity.ChatbotSession;
import com.backend.entity.ExperienceKnowledgeBaseDocument;
import com.backend.repository.ChatbotMessageRepository;
import com.backend.repository.ChatbotSessionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExperienceChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(ExperienceChatbotService.class);

    @Autowired
    private ChatbotSessionRepository chatbotSessionRepository;

    @Autowired
    private ChatbotMessageRepository chatbotMessageRepository;

    @Autowired
    private ExperienceKnowledgeBaseService experienceKnowledgeBaseService;

    @Autowired
    private OpenAIService openAIService;

    @Value("${chatbot.max.context.length}")
    private Integer maxContextLength;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatMessageResponse processMessage(ChatMessageRequest request, Long userId) {
        try {
            // Get or create chat session
            ChatbotSession session = getOrCreateSession(request.getSessionId(), userId);

            // Search knowledge base for relevant context
            List<ExperienceKnowledgeBaseDocument> relevantDocs = experienceKnowledgeBaseService.searchSimilarDocuments(request.getMessage());

            // Build context from relevant documents
            String context = experienceKnowledgeBaseService.buildContext(relevantDocs);

            // Generate AI response
            String botResponse = openAIService.generateChatResponse(request.getMessage(), context);

            // Save the conversation
            ChatbotMessage chatbotMessage = saveChatMessage(session, request.getMessage(), botResponse, relevantDocs);

            // Build response with sources
            ChatMessageResponse response = new ChatMessageResponse(botResponse, session.getSessionId());
            response.setSources(buildSourceList(relevantDocs));
            response.setTimestamp(chatbotMessage.getCreatedAt());

            logger.info("Processed chat message for session: {}", session.getSessionId());
            return response;

        } catch (Exception e) {
            logger.error("Error processing chat message: {}", e.getMessage(), e);
            return new ChatMessageResponse(
                "I'm sorry, I encountered an error processing your request. Please try again.",
                request.getSessionId() != null ? request.getSessionId() : generateSessionId()
            );
        }
    }

    public ChatSessionResponse getSessionHistory(String sessionId) {
        try {
            Optional<ChatbotSession> sessionOpt = chatbotSessionRepository.findBySessionId(sessionId);
            
            if (sessionOpt.isEmpty()) {
                logger.warn("Chat session not found: {}", sessionId);
                return null;
            }

            ChatbotSession session = sessionOpt.get();
            List<ChatbotMessage> messages = chatbotMessageRepository.findByChatbotSessionOrderByCreatedAtAsc(session);

            List<ChatSessionResponse.MessageHistory> messageHistory = messages.stream()
                .map(msg -> new ChatSessionResponse.MessageHistory(
                    msg.getUserMessage(),
                    msg.getBotResponse(),
                    msg.getCreatedAt()
                ))
                .collect(Collectors.toList());

            return new ChatSessionResponse(sessionId, messageHistory, session.getCreatedAt());

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

            logger.info("Deleted chat session: {}", sessionId);
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

    private ChatbotMessage saveChatMessage(ChatbotSession session, String userMessage, String botResponse, List<ExperienceKnowledgeBaseDocument> sources) {
        ChatbotMessage chatbotMessage = new ChatbotMessage(session, userMessage);
        chatbotMessage.setBotResponse(botResponse);

        // Save sources as JSON
        try {
            List<ChatMessageResponse.SourceDocument> sourceDocs = buildSourceList(sources);
            String sourcesJson = objectMapper.writeValueAsString(sourceDocs);
            chatbotMessage.setSources(sourcesJson);
        } catch (JsonProcessingException e) {
            logger.error("Error serializing sources: {}", e.getMessage());
            chatbotMessage.setSources("[]");
        }

        return chatbotMessageRepository.save(chatbotMessage);
    }

    private List<ChatMessageResponse.SourceDocument> buildSourceList(List<ExperienceKnowledgeBaseDocument> documents) {
        return documents.stream()
            .map(doc -> new ChatMessageResponse.SourceDocument(
                doc.getDocumentId(),
                doc.getTitle(),
                doc.getDocumentType(),
                doc.getRelevanceScore()
            ))
            .collect(Collectors.toList());
    }

    private String generateSessionId() {
        return "chat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public Long getKnowledgeBaseHealth() {
        return experienceKnowledgeBaseService.getKnowledgeBaseStats();
    }
}