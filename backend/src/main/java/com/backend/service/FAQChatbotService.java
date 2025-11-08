package com.backend.service;

import com.backend.dto.FAQSearchResult;
import com.backend.dto.OpenAIFAQMatchResponse;
import com.backend.dto.request.ChatbotMessageRequest;
import com.backend.dto.response.ChatbotMessageResponse;
import com.backend.dto.response.ChatbotSessionResponse;
import com.backend.entity.FAQChatbotMessage;
import com.backend.entity.FAQChatbotSession;
import com.backend.entity.FAQKnowledgeBase;
import com.backend.repository.FAQChatbotMessageRepository;
import com.backend.repository.FAQChatbotSessionRepository;
import com.backend.service.OpenAIService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    
    @Autowired(required = false)
    private OpenAIService openAIService;
    
    @Value("${chatbot.confidence.high:0.7}")
    private Double highConfidenceThreshold;
    
    @Value("${chatbot.confidence.medium:0.5}")
    private Double mediumConfidenceThreshold;
    
    @Value("${chatbot.openai.faq.match.enabled:true}")
    private Boolean openAIMatchEnabled;
    
    @Value("${chatbot.openai.faq.candidates.count:25}")
    private Integer openAICandidatesCount;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String NO_MATCH_MESSAGE = "I couldn't find a similar question in our FAQ. Please rephrase your question or visit our [FAQ page](/faq) for more information. You can also submit a [support ticket](/support) to ask a question.";

    public ChatbotMessageResponse processMessage(ChatbotMessageRequest request, Long userId) {
        try {
            // Get or create chat session
            FAQChatbotSession session = getOrCreateSession(request.getSessionId(), userId);

            // Search knowledge base for similar FAQs with confidence scores
            List<FAQSearchResult> searchResults = faqKnowledgeBaseService.searchSimilarFAQsWithConfidence(request.getMessage());

            String botResponse;
            List<ChatbotMessageResponse.SourceDocument> sources = new ArrayList<>();

            if (searchResults.isEmpty()) {
                // No similar FAQ found
                botResponse = NO_MATCH_MESSAGE + "\n\n" + buildSupportTicketOption();
            } else {
                // Use OpenAI for intelligent matching if enabled
                if (openAIMatchEnabled && openAIService != null) {
                    // Get top N FAQs for OpenAI analysis
                    List<FAQKnowledgeBase> candidateFAQs = searchResults.stream()
                        .limit(openAICandidatesCount)
                        .map(FAQSearchResult::getFaq)
                        .collect(Collectors.toList());
                    
                    logger.info("Using OpenAI to analyze {} candidate FAQs for query: '{}'", candidateFAQs.size(), request.getMessage());
                    
                    OpenAIFAQMatchResponse matchResponse = openAIService.analyzeFAQMatch(request.getMessage(), candidateFAQs);
                    
                    logger.info("OpenAI match result: type={}, index={}, confidence={}", 
                        matchResponse.getMatchType(), matchResponse.getMatchedFAQIndex(), matchResponse.getConfidence());
                    
                    // Handle based on match type
                    if (matchResponse.getMatchType() == OpenAIFAQMatchResponse.MatchType.EXACT && 
                        matchResponse.getMatchedFAQIndex() != null &&
                        matchResponse.getMatchedFAQIndex() < candidateFAQs.size()) {
                        // Exact match - return FAQ answer directly
                        FAQKnowledgeBase matchedFAQ = candidateFAQs.get(matchResponse.getMatchedFAQIndex());
                        logger.info("OpenAI found EXACT match: FAQ {}", matchedFAQ.getKnowledgeId());
                        botResponse = formatFAQResponse(matchedFAQ.getContent());
                        sources.add(new ChatbotMessageResponse.SourceDocument(
                            String.valueOf(matchedFAQ.getKnowledgeId()),
                            matchedFAQ.getCategory() != null ? matchedFAQ.getCategory() : "FAQ",
                            "faq",
                            matchResponse.getConfidence()
                        ));
                    } else if (matchResponse.getMatchType() == OpenAIFAQMatchResponse.MatchType.CLOSE && 
                               matchResponse.getMatchedFAQIndex() != null &&
                               matchResponse.getMatchedFAQIndex() < candidateFAQs.size()) {
                        // Close match - return answer with note
                        FAQKnowledgeBase matchedFAQ = candidateFAQs.get(matchResponse.getMatchedFAQIndex());
                        logger.info("OpenAI found CLOSE match: FAQ {}", matchedFAQ.getKnowledgeId());
                        botResponse = formatFAQResponse(matchedFAQ.getContent()) + 
                            "\n\n*Note: This answer is closely related to your question. If it doesn't fully address your concern, please let me know or " +
                            buildSupportTicketOption().toLowerCase();
                        sources.add(new ChatbotMessageResponse.SourceDocument(
                            String.valueOf(matchedFAQ.getKnowledgeId()),
                            matchedFAQ.getCategory() != null ? matchedFAQ.getCategory() : "FAQ",
                            "faq",
                            matchResponse.getConfidence()
                        ));
                    } else {
                        // Unclear - generate clarification with options
                        logger.info("OpenAI found UNCLEAR match, generating clarification");
                        List<FAQKnowledgeBase> suggestedFAQs = new ArrayList<>();
                        if (matchResponse.getSuggestedFAQIndices() != null) {
                            for (Integer index : matchResponse.getSuggestedFAQIndices()) {
                                if (index != null && index >= 0 && index < candidateFAQs.size()) {
                                    suggestedFAQs.add(candidateFAQs.get(index));
                                }
                            }
                        }
                        // Fallback to top results if no suggestions
                        if (suggestedFAQs.isEmpty()) {
                            suggestedFAQs = candidateFAQs.stream().limit(5).collect(Collectors.toList());
                        }
                        botResponse = buildClarificationPromptWithOpenAI(request.getMessage(), suggestedFAQs);
                        sources = suggestedFAQs.stream()
                            .map(faq -> new ChatbotMessageResponse.SourceDocument(
                                String.valueOf(faq.getKnowledgeId()),
                                faq.getCategory() != null ? faq.getCategory() : "FAQ",
                                "faq",
                                0.5
                            ))
                            .collect(Collectors.toList());
                    }
                } else {
                    // Fallback to original logic if OpenAI matching is disabled
                    FAQSearchResult topResult = searchResults.get(0);
                    Double confidence = topResult.getConfidence();
                    
                    logger.info("OpenAI matching disabled, using vector search confidence: {} for query: '{}'", confidence, request.getMessage());
                    
                    // High confidence (>0.7): Return direct answer
                    if (confidence >= highConfidenceThreshold) {
                        logger.info("High confidence match found, returning direct answer");
                        botResponse = formatFAQResponse(topResult.getFaq().getContent());
                        sources.add(new ChatbotMessageResponse.SourceDocument(
                            String.valueOf(topResult.getFaq().getKnowledgeId()),
                            topResult.getFaq().getCategory() != null ? topResult.getFaq().getCategory() : "FAQ",
                            "faq",
                            confidence
                        ));
                    }
                    // Medium confidence (0.5-0.7): Check if there are multiple close matches
                    else if (confidence >= mediumConfidenceThreshold) {
                        // Check if there are multiple close matches (within 0.1 confidence)
                        List<FAQSearchResult> closeMatches = searchResults.stream()
                            .filter(r -> r.getConfidence() >= confidence - 0.1)
                            .limit(3)
                            .collect(Collectors.toList());
                        
                        if (closeMatches.size() > 1) {
                            // Multiple close matches - show options
                            logger.info("Multiple close matches found ({}), showing options", closeMatches.size());
                            botResponse = buildMultipleOptionsResponse(closeMatches, request.getMessage()) + 
                                "\n\n" + buildSupportTicketOption();
                            sources = closeMatches.stream()
                                .map(r -> new ChatbotMessageResponse.SourceDocument(
                                    String.valueOf(r.getFaq().getKnowledgeId()),
                                    r.getFaq().getCategory() != null ? r.getFaq().getCategory() : "FAQ",
                                    "faq",
                                    r.getConfidence()
                                ))
                                .collect(Collectors.toList());
                        } else {
                            // Single match but medium confidence - return answer with disclaimer
                            logger.info("Medium confidence match, returning answer with disclaimer");
                            botResponse = formatFAQResponse(topResult.getFaq().getContent()) + 
                                "\n\n*Note: If this doesn't answer your question, please try rephrasing or ask for clarification.* " +
                                buildSupportTicketOption();
                            sources.add(new ChatbotMessageResponse.SourceDocument(
                                String.valueOf(topResult.getFaq().getKnowledgeId()),
                                topResult.getFaq().getCategory() != null ? topResult.getFaq().getCategory() : "FAQ",
                                "faq",
                                confidence
                            ));
                        }
                    }
                    // Low confidence (<0.5): Prompt for clarification or show options
                    else {
                        logger.info("Low confidence match ({}), prompting for clarification", confidence);
                        botResponse = buildClarificationPrompt(searchResults, request.getMessage());
                        sources = searchResults.stream()
                            .limit(3)
                            .map(r -> new ChatbotMessageResponse.SourceDocument(
                                String.valueOf(r.getFaq().getKnowledgeId()),
                                r.getFaq().getCategory() != null ? r.getFaq().getCategory() : "FAQ",
                                "faq",
                                r.getConfidence()
                            ))
                            .collect(Collectors.toList());
                    }
                }
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
    
    /**
     * Build response with multiple FAQ options for user to choose from
     */
    private String buildMultipleOptionsResponse(List<FAQSearchResult> results, String userQuery) {
        StringBuilder response = new StringBuilder();
        response.append("I found a few questions that might help. Which one matches what you're looking for?\n\n");
        
        for (int i = 0; i < Math.min(results.size(), 3); i++) {
            FAQSearchResult result = results.get(i);
            String question = extractQuestion(result.getFaq().getContent());
            response.append(String.format("%d. **%s**\n", i + 1, question));
        }
        
        response.append("\nPlease let me know which number, or rephrase your question if none of these match.");
        return response.toString();
    }
    
    /**
     * Build clarification prompt with OpenAI when match is unclear
     * Includes FAQ options and support ticket option
     */
    private String buildClarificationPromptWithOpenAI(String userQuery, List<FAQKnowledgeBase> suggestedFAQs) {
        if (openAIService != null && !suggestedFAQs.isEmpty()) {
            try {
                // Build context with suggested FAQs
                StringBuilder context = new StringBuilder();
                context.append("User asked: ").append(userQuery).append("\n\n");
                context.append("Here are some FAQs that might help:\n");
                for (int i = 0; i < suggestedFAQs.size(); i++) {
                    FAQKnowledgeBase faq = suggestedFAQs.get(i);
                    String question = extractQuestion(faq.getContent());
                    context.append(String.format("%d. %s\n", i + 1, question));
                }
                
                String prompt = "The user asked: \"" + userQuery + "\"\n\n" +
                    "I found some potentially related FAQs, but I'm not certain which one matches their question. " +
                    "Generate a friendly, helpful response that:\n" +
                    "1. Acknowledges their question\n" +
                    "2. Lists the numbered FAQ options above (1, 2, 3, etc.)\n" +
                    "3. Asks them to specify which one matches, or to provide more details\n" +
                    "4. Keep it concise and friendly (2-3 sentences)\n\n" +
                    "Context:\n" + context.toString();
                
                String clarification = openAIService.generateChatResponse(prompt, "");
                if (clarification != null && !clarification.trim().isEmpty()) {
                    return clarification + "\n\n" + buildSupportTicketOption();
                }
            } catch (Exception e) {
                logger.warn("Error generating clarification prompt with OpenAI: {}", e.getMessage());
            }
        }
        
        // Fallback: Build clarification with FAQ options manually
        return buildClarificationPromptFallback(userQuery, suggestedFAQs);
    }
    
    /**
     * Build clarification prompt when confidence is low (fallback method)
     */
    private String buildClarificationPrompt(List<FAQSearchResult> results, String userQuery) {
        if (openAIService != null) {
            try {
                // Use OpenAI to generate a clarifying question
                String context = "User asked: " + userQuery + "\n\n";
                context += "Possible related FAQs:\n";
                for (int i = 0; i < Math.min(results.size(), 3); i++) {
                    FAQSearchResult result = results.get(i);
                    context += String.format("- %s\n", extractQuestion(result.getFaq().getContent()));
                }
                
                String prompt = "The user asked: \"" + userQuery + "\"\n\n" +
                    "I found some potentially related FAQs, but I'm not confident which one matches their question. " +
                    "Generate a friendly, concise clarifying question (1-2 sentences) to help understand what they're looking for. " +
                    "Don't list the FAQs, just ask a natural follow-up question.\n\n" +
                    "Context:\n" + context;
                
                String clarification = openAIService.generateChatResponse(prompt, "");
                if (clarification != null && !clarification.trim().isEmpty()) {
                    return clarification + "\n\n" + buildSupportTicketOption();
                }
            } catch (Exception e) {
                logger.warn("Error generating clarification prompt with OpenAI: {}", e.getMessage());
            }
        }
        
        // Fallback: Generic clarification prompt
        StringBuilder response = new StringBuilder();
        response.append("I want to make sure I understand your question correctly. ");
        response.append("Could you provide a bit more detail about what you're looking for?\n\n");
        response.append("For example:\n");
        response.append("- Are you asking about booking, cancellation, refunds, or something else?\n");
        response.append("- What specific information do you need?\n\n");
        response.append("Or feel free to rephrase your question!");
        response.append("\n\n").append(buildSupportTicketOption());
        return response.toString();
    }
    
    /**
     * Fallback clarification prompt builder with FAQ options
     */
    private String buildClarificationPromptFallback(String userQuery, List<FAQKnowledgeBase> suggestedFAQs) {
        StringBuilder response = new StringBuilder();
        response.append("I found a few questions that might help. Which one matches what you're looking for?\n\n");
        
        for (int i = 0; i < Math.min(suggestedFAQs.size(), 5); i++) {
            FAQKnowledgeBase faq = suggestedFAQs.get(i);
            String question = extractQuestion(faq.getContent());
            response.append(String.format("%d. **%s**\n", i + 1, question));
        }
        
        response.append("\nPlease let me know which number matches your question, or provide more details if none of these help.");
        response.append("\n\n").append(buildSupportTicketOption());
        return response.toString();
    }
    
    /**
     * Build support ticket option text
     */
    private String buildSupportTicketOption() {
        return "If none of these help, you can [submit a support ticket](/support) and our team will assist you.";
    }
    
    /**
     * Extract question from FAQ content
     */
    private String extractQuestion(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "FAQ Question";
        }
        
        // Try to extract the question part
        String[] sentences = content.split("[.!?]+", 2);
        if (sentences.length > 0) {
            String question = sentences[0].trim();
            if (question.endsWith("?")) {
                return question;
            } else if (question.length() > 100) {
                return question.substring(0, 100) + "...";
            } else {
                return question;
            }
        }
        
        // Fallback: return first 100 characters
        return content.length() > 100 ? content.substring(0, 100) + "..." : content;
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

