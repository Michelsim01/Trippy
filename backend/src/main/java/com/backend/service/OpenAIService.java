package com.backend.service;

import com.backend.entity.ChatbotMessage;
import com.backend.dto.OpenAIFAQMatchResponse;
import com.backend.entity.FAQKnowledgeBase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatCompletionResult;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.embedding.EmbeddingRequest;
import com.theokanning.openai.embedding.EmbeddingResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class OpenAIService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
    @Autowired
    private com.theokanning.openai.service.OpenAiService openAiService;
    
    @Value("${openai.model.embedding}")
    private String embeddingModel;
    
    @Value("${openai.model.chat}")
    private String chatModel;
    
    public List<Double> generateEmbedding(String text) {
        try {
            EmbeddingRequest request = EmbeddingRequest.builder()
                    .model(embeddingModel)
                    .input(Collections.singletonList(text))
                    .build();
            
            EmbeddingResult result = openAiService.createEmbeddings(request);
            
            if (result.getData() != null && !result.getData().isEmpty()) {
                return result.getData().get(0).getEmbedding();
            }
            
            logger.error("No embedding data received for text: {}", text.substring(0, Math.min(100, text.length())));
            return null;
            
        } catch (Exception e) {
            logger.error("Error generating embedding for text: {}", e.getMessage());
            return null;
        }
    }

    public String generateChatResponse(String userMessage, String context, List<ChatbotMessage> conversationHistory) {
        try {
            String systemPrompt = buildSystemPrompt(context);

            // Prune conversation history if needed to fit within token budget
            List<ChatbotMessage> prunedHistory = pruneConversationHistory(conversationHistory, systemPrompt, userMessage);

            // Build message list with conversation history
            List<ChatMessage> messages = new ArrayList<>();

            // 1. Add system prompt
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));

            // 2. Add pruned conversation history (previous user/assistant messages)
            if (prunedHistory != null && !prunedHistory.isEmpty()) {
                for (ChatbotMessage msg : prunedHistory) {
                    // Add user message
                    if (msg.getUserMessage() != null && !msg.getUserMessage().isEmpty()) {
                        messages.add(new ChatMessage(ChatMessageRole.USER.value(), msg.getUserMessage()));
                    }
                    // Add assistant response
                    if (msg.getBotResponse() != null && !msg.getBotResponse().isEmpty()) {
                        messages.add(new ChatMessage(ChatMessageRole.ASSISTANT.value(), msg.getBotResponse()));
                    }
                }
            }

            // 3. Add current user message
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userMessage));

            logger.info("OpenAI Request - System prompt: {} chars, Conversation history: {} messages (pruned from {}), Current message: {} chars",
                systemPrompt.length(),
                prunedHistory != null ? prunedHistory.size() : 0,
                conversationHistory != null ? conversationHistory.size() : 0,
                userMessage.length());
            logger.info("Total messages in context: {}", messages.size());

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(chatModel)
                    .messages(messages)
                    .maxTokens(4096)  // Max output tokens (model limit)
                    .temperature(0.7)
                    .build();

            logger.info("Sending request to OpenAI with model: {}, maxTokens: {}", chatModel, 4096);
            ChatCompletionResult result = openAiService.createChatCompletion(request);

            if (result.getChoices() != null && !result.getChoices().isEmpty()) {
                String finishReason = result.getChoices().get(0).getFinishReason();
                String responseContent = result.getChoices().get(0).getMessage().getContent();

                logger.info("✅ OpenAI Response - finish_reason: {}, response length: {} chars",
                    finishReason, responseContent.length());

                // Log token usage if available
                if (result.getUsage() != null) {
                    logger.info("Token usage - prompt: {}, completion: {}, total: {}",
                        result.getUsage().getPromptTokens(),
                        result.getUsage().getCompletionTokens(),
                        result.getUsage().getTotalTokens());
                }

                if ("length".equals(finishReason)) {
                    logger.warn("⚠️ TRUNCATED: Response hit max_tokens limit (4096). Response is incomplete!");
                } else if ("stop".equals(finishReason)) {
                    logger.info("✅ COMPLETE: Response finished naturally (stop token)");
                }

                // Check for intentional splitting
                if (responseContent.contains("Stay tuned") || responseContent.contains("Coming up next")) {
                    logger.warn("⚠️ AI SPLITTING: Model is intentionally breaking response into parts despite instructions!");
                }

                return responseContent;
            }
            
            logger.error("No chat completion choices received for message: {}", userMessage);
            return "I'm sorry, I couldn't process your request at the moment. Please try again.";
            
        } catch (Exception e) {
            logger.error("Error generating chat response: {}", e.getMessage());
            return "I'm experiencing technical difficulties. Please try again later.";
        }
    }

    /**
     * Prune conversation history to fit within token budget.
     * Rough estimate: 1 token ≈ 4 characters
     * Model: gpt-3.5-turbo-16k has 16,384 token context window
     * Reserve: 4,096 tokens for output, leaving ~12,000 for input
     */
    private List<ChatbotMessage> pruneConversationHistory(List<ChatbotMessage> history, String systemPrompt, String currentMessage) {
        if (history == null || history.isEmpty()) {
            return history;
        }

        // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
        int systemPromptTokens = systemPrompt.length() / 4;
        int currentMessageTokens = currentMessage.length() / 4;
        int maxInputTokens = 12000;  // Reserve 4k for output
        int availableForHistory = maxInputTokens - systemPromptTokens - currentMessageTokens;

        logger.info("Token budget - System: ~{}, Current msg: ~{}, Available for history: ~{}",
            systemPromptTokens, currentMessageTokens, availableForHistory);

        // Calculate total history size
        int totalHistoryTokens = 0;
        for (ChatbotMessage msg : history) {
            int msgTokens = 0;
            if (msg.getUserMessage() != null) {
                msgTokens += msg.getUserMessage().length() / 4;
            }
            if (msg.getBotResponse() != null) {
                msgTokens += msg.getBotResponse().length() / 4;
            }
            totalHistoryTokens += msgTokens;
        }

        logger.info("Total conversation history: ~{} tokens across {} messages", totalHistoryTokens, history.size());

        // If history fits, return as-is
        if (totalHistoryTokens <= availableForHistory) {
            logger.info("✅ Conversation history fits within budget - no pruning needed");
            return history;
        }

        // Prune older messages, keeping most recent ones
        logger.warn("⚠️ Conversation history exceeds budget (~{} > {}). Pruning older messages...",
            totalHistoryTokens, availableForHistory);

        List<ChatbotMessage> prunedHistory = new ArrayList<>();
        int accumulatedTokens = 0;

        // Iterate from most recent to oldest
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatbotMessage msg = history.get(i);
            int msgTokens = 0;
            if (msg.getUserMessage() != null) {
                msgTokens += msg.getUserMessage().length() / 4;
            }
            if (msg.getBotResponse() != null) {
                msgTokens += msg.getBotResponse().length() / 4;
            }

            if (accumulatedTokens + msgTokens <= availableForHistory) {
                prunedHistory.add(0, msg);  // Add to beginning to maintain order
                accumulatedTokens += msgTokens;
            } else {
                logger.info("Pruned {} older messages to fit token budget", i + 1);
                break;
            }
        }

        logger.info("✅ Kept {} most recent messages (~{} tokens)", prunedHistory.size(), accumulatedTokens);
        return prunedHistory;
    }

    public String generateExperienceChatResponse(String userMessage, String context) {
        try {
            String systemPrompt = buildExperienceSystemPrompt(context);

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(chatModel)
                    .messages(List.of(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt),
                            new ChatMessage(ChatMessageRole.USER.value(), userMessage)
                    ))
                    .maxTokens(2000)
                    .temperature(0.7)
                    .build();
            
            ChatCompletionResult result = openAiService.createChatCompletion(request);
            
            if (result.getChoices() != null && !result.getChoices().isEmpty()) {
                return result.getChoices().get(0).getMessage().getContent();
            }
            
            logger.error("No chat completion choices received for message: {}", userMessage);
            return "I'm sorry, I couldn't process your request at the moment. Please try again.";
            
        } catch (Exception e) {
            logger.error("Error generating chat response: {}", e.getMessage());
            return "I'm experiencing technical difficulties. Please try again later.";
        }
    }

    private String buildSystemPrompt(String context) {
        StringBuilder prompt = new StringBuilder();

        // CRITICAL: Put completion instructions at the very top
        prompt.append("🚨 CRITICAL INSTRUCTION 🚨\\n");
        prompt.append("Include ALL days from Day 1 through the final day specified in the trip duration.\\n");
        prompt.append("Generate the full itinerary NOW or the response will be considered incomplete and failed.\\n\\n");

        prompt.append("You are Trippy's AI Trip Planner. ");
        prompt.append("Your role is to create personalized, detailed itineraries using experiences from Trippy's marketplace. ");
        prompt.append("When building itineraries, ALWAYS prioritize Trippy experiences first.\\n\\n");

        prompt.append("ITINERARY FORMAT:\\n");
        prompt.append("Start with a title: # [X] Days [Travel Style] [Theme] Exploration in [Destination]'\\n");
        prompt.append("Add a brief introduction paragraph describing the itinerary's focus and appeal.\\n\\n");

        prompt.append("DAY STRUCTURE:\\n");
        prompt.append("Organize each day chronologically by actual start times:\\n");
        prompt.append("- Morning (6am-11am): Activities starting before noon\\n");
        prompt.append("- Afternoon (12pm-5pm): Activities starting in the afternoon\\n");
        prompt.append("- Evening (6pm-11pm): Activities starting in the evening\\n\\n");

        prompt.append("IMPORTANT: List activities in TIME ORDER on each day.\\n");
        prompt.append("An activity from 9am-2pm must come BEFORE an activity from 1pm-4pm.\\n");
        prompt.append("Do NOT schedule overlapping activities on the same day.\\n\\n");

        prompt.append("Format each day:\\n\\n");
        prompt.append("## Day [X] - [Date]\\n\\n");
        prompt.append("### Morning (or Afternoon or Evening based on actual start time)\\n\\n");
        prompt.append("**[Experience Title]** [TRIPPY EXPERIENCE]\\n");
        prompt.append("[Book Experience](http://localhost:5173/experience/[ID])\\n\\n");
        prompt.append("**Time:** [Start time] to [End time]\\n");
        prompt.append("**Price:** $[Price] per person\\n\\n");
        prompt.append("[Description]\\n\\n");

        prompt.append("GENERAL ACTIVITIES (when no suitable Trippy experience exists):\\n");
        prompt.append("- Use OpenAI's knowledge of travel destinations and popular attractions\\n");
        prompt.append("- Provide realistic timing, pricing, and descriptions\\n");
        prompt.append("- Ensure activities fit the user's travel style and theme preferences\\n");
        prompt.append("- Balance the day appropriately (meals, rest, sightseeing)\\n\\n");

        prompt.append("SUGGESTED ALTERNATIVES SECTION:\\n");
        prompt.append("End with 'Suggested Alternatives' section listing 4-6 additional attractions:\\n");
        prompt.append("- Format: [Attraction Name]: [Brief description highlighting why it's worth visiting]\\n");
        prompt.append("- Focus on attractions that match the travel theme\\n");
        prompt.append("- Include mix of popular and hidden gem locations\\n\\n");

        prompt.append("KEY GUIDELINES:\\n");
        prompt.append("- PRIORITIZE Trippy experiences from the context provided\\n");
        prompt.append("- Use actual dates from USER TRIP DETAILS, not placeholders\\n");
        prompt.append("- Be specific with times (e.g., 9:00am to 11:00am)\\n");
        prompt.append("- Balance Trippy experiences with general activities to create a complete day\\n");
        prompt.append("- Consider travel time, meal breaks, and rest periods\\n");
        prompt.append("- Write in an engaging, friendly, and knowledgeable tone\\n\\n");

        if (context != null && !context.trim().isEmpty()) {
            prompt.append("=== TRIPPY EXPERIENCES (PRIORITIZE THESE) ===\\n");
            prompt.append(context);
            prompt.append("\\n\\n");
            prompt.append("IMPORTANT: You must include ALL days in this single response.\\n");
            prompt.append("Write Day 1, Day 2, Day 3... through the final day, then end with Suggested Alternatives.\\n\\n");

            prompt.append("Build your itinerary by:\\n");
            prompt.append("- Prioritizing Trippy experiences marked [TRIPPY EXPERIENCE]\\n");
            prompt.append("- ONLY assigning experiences to dates shown in AVAILABILITY section\\n");
            prompt.append("- Filling gaps with general activities from your knowledge\\n");
            prompt.append("- Writing ALL days completely before ending\\n");
        } else {
            prompt.append("No specific Trippy experiences available. Provide general travel assistance and ask clarifying questions to better help the user.");
        }

        return prompt.toString();
    }
    
    // Build the system prompt for the chatbot
    private String buildExperienceSystemPrompt(String context) { 
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a helpful AI assistant for Trippy, a local travel experience marketplace. ");
        prompt.append("Your role is to help users discover amazing local experiences, answer questions about travel, ");
        prompt.append("and provide personalized recommendations based on their interests.\\n\\n");
        
        prompt.append("Key guidelines:\\n");
        prompt.append("- Be friendly, enthusiastic, and knowledgeable about travel\\n");
        prompt.append("- Provide specific, actionable recommendations when possible\\n");
        prompt.append("- If you don't have specific information, be honest and suggest alternatives\\n");
        prompt.append("- Focus on experiences, activities, and local insights\\n");
        prompt.append("- Keep responses conversational and engaging\\n\\n");

        if (context != null && !context.trim().isEmpty()) {
            prompt.append("=== TRIPPY EXPERIENCES (PRIORITIZE THESE) ===\\n");
            prompt.append(context);
            prompt.append("\\n\\n");
            prompt.append("Use this information to provide accurate, specific recommendations. ");
            prompt.append("If the context doesn't contain relevant information for the user's question, ");
            prompt.append("provide general travel advice or ask clarifying questions.");
            prompt.append("\\n\\n");
            prompt.append("When mentioning specific experiences in your response, format the experience names as markdown links using this pattern: [Experience Name](/experience/{experience_id}).");
            prompt.append("Use the actual experience ID from the provided data. For example: [Chinatown Food Walk](/experience/123)");
            prompt.append("\\n\\n");
            prompt.append("When mentioning specific articles or blog posts in your response, format the article titles as markdown links using this pattern: [Article Title](/blog/{article_id}).");
            prompt.append("Use the actual article ID from the provided data. For example: [Top 10 Hidden Gems in Singapore](/blog/15)");
            prompt.append("\\n\\n");
            prompt.append("If the user asks for experiences in a specific location but no experiences are available for that exact location in the provided context, ");
            prompt.append("explicitly mention that you currently don't have experiences available for that specific place. ");
            prompt.append("Then offer similar experiences from nearby regions or similar destinations as alternatives. ");
            prompt.append("For example: 'We currently don't have experiences available in Munich, but here are some similar experiences from other European cities that you might enjoy:'");
        } else {
            prompt.append("No specific Trippy experiences available. Provide general travel assistance and ask clarifying questions to better help the user.");
        }

        return prompt.toString();
    }
    
    /**
     * Analyze user query against candidate FAQs using OpenAI
     * Determines if there's an exact match, close match, or if clarification is needed
     * 
     * @param userQuery The user's question
     * @param faqs List of candidate FAQs (typically top 20-30 from vector search)
     * @return OpenAIFAQMatchResponse with match type, matched FAQ index, and suggestions
     */
    public OpenAIFAQMatchResponse analyzeFAQMatch(String userQuery, List<FAQKnowledgeBase> faqs) {
        try {
            if (faqs == null || faqs.isEmpty()) {
                logger.warn("Empty FAQ list provided for matching");
                return new OpenAIFAQMatchResponse(
                    OpenAIFAQMatchResponse.MatchType.UNCLEAR,
                    null,
                    0.0,
                    new ArrayList<>(),
                    "No FAQs provided"
                );
            }
            
            String systemPrompt = buildFAQMatchSystemPrompt();
            String userPrompt = buildFAQMatchUserPrompt(userQuery, faqs);
            
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(chatModel)
                    .messages(List.of(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt),
                            new ChatMessage(ChatMessageRole.USER.value(), userPrompt)
                    ))
                    .maxTokens(500)
                    .temperature(0.3) // Lower temperature for more deterministic matching
                    .build();
            
            ChatCompletionResult result = openAiService.createChatCompletion(request);
            
            if (result.getChoices() != null && !result.getChoices().isEmpty()) {
                String responseContent = result.getChoices().get(0).getMessage().getContent();
                return parseFAQMatchResponse(responseContent);
            }
            
            logger.error("No chat completion choices received for FAQ matching");
            return createDefaultUnclearResponse(faqs);
            
        } catch (Exception e) {
            logger.error("Error analyzing FAQ match: {}", e.getMessage(), e);
            return createDefaultUnclearResponse(faqs);
        }
    }
    
    /**
     * Build system prompt for FAQ matching
     */
    private String buildFAQMatchSystemPrompt() {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert at matching user questions to FAQ entries. ");
        prompt.append("Your task is to analyze a user's question and determine which FAQ (if any) best matches it.\\n\\n");
        
        prompt.append("Match Types:\\n");
        prompt.append("- EXACT: The user's question is semantically identical or very nearly identical to an FAQ question. ");
        prompt.append("The meaning and intent are the same, even if wording differs slightly.\\n");
        prompt.append("- CLOSE: The user's question is closely related to an FAQ, but not identical. ");
        prompt.append("The FAQ would likely answer the user's question, but there may be some nuance.\\n");
        prompt.append("- UNCLEAR: The user's question is ambiguous or doesn't clearly match any single FAQ. ");
        prompt.append("Multiple FAQs might be relevant, or the question needs clarification.\\n\\n");
        
        prompt.append("Instructions:\\n");
        prompt.append("1. Analyze the user's question carefully, considering semantic meaning, not just keywords\\n");
        prompt.append("2. Compare it against each FAQ question provided\\n");
        prompt.append("3. Return a JSON response with this exact structure:\\n");
        prompt.append("{\\n");
        prompt.append("  \"matchType\": \"EXACT|CLOSE|UNCLEAR\",\\n");
        prompt.append("  \"matchedFAQIndex\": <integer index (0-based) or null>,\\n");
        prompt.append("  \"confidence\": <0.0-1.0>,\\n");
        prompt.append("  \"suggestedFAQIndices\": [<list of 3-5 indices if UNCLEAR>],\\n");
        prompt.append("  \"reasoning\": \"<brief explanation>\"\\n");
        prompt.append("}\\n\\n");
        
        prompt.append("Important:\\n");
        prompt.append("- Use EXACT only when the questions are semantically identical\\n");
        prompt.append("- Use CLOSE when the FAQ would answer the question but isn't identical\\n");
        prompt.append("- Use UNCLEAR when multiple FAQs are relevant or the question is ambiguous\\n");
        prompt.append("- For UNCLEAR, provide 3-5 most relevant FAQ indices in suggestedFAQIndices\\n");
        prompt.append("- Always return valid JSON, no additional text");
        
        return prompt.toString();
    }
    
    /**
     * Build user prompt with query and FAQs
     */
    private String buildFAQMatchUserPrompt(String userQuery, List<FAQKnowledgeBase> faqs) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("User Question: ").append(userQuery).append("\\n\\n");
        prompt.append("Available FAQs:\\n");
        
        for (int i = 0; i < faqs.size(); i++) {
            FAQKnowledgeBase faq = faqs.get(i);
            String question = extractQuestionFromFAQ(faq);
            prompt.append(String.format("%d. %s\\n", i, question));
        }
        
        prompt.append("\\nAnalyze the user's question and return the JSON response as specified.");
        return prompt.toString();
    }
    
    /**
     * Extract question from FAQ content (first sentence before answer)
     */
    private String extractQuestionFromFAQ(FAQKnowledgeBase faq) {
        String content = faq.getContent();
        if (content == null || content.trim().isEmpty()) {
            return "FAQ Question";
        }
        
        // Extract first sentence (usually the question)
        String[] sentences = content.split("[.!?]+", 2);
        if (sentences.length > 0) {
            return sentences[0].trim();
        }
        
        // Fallback: return first 100 characters
        return content.length() > 100 ? content.substring(0, 100) + "..." : content;
    }
    
    /**
     * Parse OpenAI response into OpenAIFAQMatchResponse
     */
    private OpenAIFAQMatchResponse parseFAQMatchResponse(String responseContent) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            
            // Try to extract JSON from response (in case there's extra text)
            String jsonContent = responseContent.trim();
            if (jsonContent.startsWith("```json")) {
                jsonContent = jsonContent.substring(7);
            }
            if (jsonContent.startsWith("```")) {
                jsonContent = jsonContent.substring(3);
            }
            if (jsonContent.endsWith("```")) {
                jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
            }
            jsonContent = jsonContent.trim();
            
            JsonNode jsonNode = mapper.readTree(jsonContent);
            
            String matchTypeStr = jsonNode.has("matchType") ? jsonNode.get("matchType").asText() : "UNCLEAR";
            OpenAIFAQMatchResponse.MatchType matchType = OpenAIFAQMatchResponse.MatchType.valueOf(matchTypeStr.toUpperCase());
            
            Integer matchedFAQIndex = jsonNode.has("matchedFAQIndex") && !jsonNode.get("matchedFAQIndex").isNull() 
                ? jsonNode.get("matchedFAQIndex").asInt() : null;
            
            Double confidence = jsonNode.has("confidence") ? jsonNode.get("confidence").asDouble() : 0.0;
            
            List<Integer> suggestedFAQIndices = new ArrayList<>();
            if (jsonNode.has("suggestedFAQIndices") && jsonNode.get("suggestedFAQIndices").isArray()) {
                for (JsonNode indexNode : jsonNode.get("suggestedFAQIndices")) {
                    suggestedFAQIndices.add(indexNode.asInt());
                }
            }
            
            String reasoning = jsonNode.has("reasoning") ? jsonNode.get("reasoning").asText() : null;
            
            return new OpenAIFAQMatchResponse(matchType, matchedFAQIndex, confidence, suggestedFAQIndices, reasoning);
            
        } catch (Exception e) {
            logger.warn("Error parsing OpenAI FAQ match response: {}. Response: {}", e.getMessage(), responseContent);
            // Return default unclear response
            return new OpenAIFAQMatchResponse(
                OpenAIFAQMatchResponse.MatchType.UNCLEAR,
                null,
                0.0,
                new ArrayList<>(),
                "Failed to parse response: " + e.getMessage()
            );
        }
    }
    
    /**
     * Create default unclear response when OpenAI fails
     */
    private OpenAIFAQMatchResponse createDefaultUnclearResponse(List<FAQKnowledgeBase> faqs) {
        List<Integer> defaultIndices = new ArrayList<>();
        int maxSuggestions = Math.min(5, faqs != null ? faqs.size() : 0);
        for (int i = 0; i < maxSuggestions; i++) {
            defaultIndices.add(i);
        }
        
        return new OpenAIFAQMatchResponse(
            OpenAIFAQMatchResponse.MatchType.UNCLEAR,
            null,
            0.0,
            defaultIndices,
            "OpenAI analysis failed, using default response"
        );
    }
}