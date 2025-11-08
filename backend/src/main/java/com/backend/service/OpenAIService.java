package com.backend.service;

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

    public String generateChatResponse(String userMessage, String context) {
        try {
            String systemPrompt = buildSystemPrompt(context);
            
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(chatModel)
                    .messages(List.of(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt),
                            new ChatMessage(ChatMessageRole.USER.value(), userMessage)
                    ))
                    .maxTokens(500)
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
    
    public String generateExperienceChatResponse(String userMessage, String context) {
        try {
            String systemPrompt = buildExperienceSystemPrompt(context);
            
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(chatModel)
                    .messages(List.of(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt),
                            new ChatMessage(ChatMessageRole.USER.value(), userMessage)
                    ))
                    .maxTokens(500)
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
        prompt.append("You are Trippy's AI Trip Planner. ");
        prompt.append("Your role is to create personalized itineraries using experiences from Trippy's marketplace. ");
        prompt.append("When building itineraries, ALWAYS prioritize Trippy experiences first.\\n\\n");

        prompt.append("Key guidelines:\\n");
        prompt.append("- PRIORITIZE experiences from Trippy (provided in context below)\\n");
        prompt.append("- Create a day-by-day itinerary with SPECIFIC DATES assigned to each day\\n");
        prompt.append("- Use the availability section to choose dates when Trippy experiences are bookable\\n");
        prompt.append("- Format each day with a clear date header (e.g., 'Day 1: January 15, 2025')\\n");
        prompt.append("\\n");
        prompt.append("- For Trippy experiences, use this exact format:\\n");
        prompt.append("  [START TIME] (e.g., 9:00 AM)\\n");
        prompt.append("  [FROM TRIPPY] Experience Name\\n");
        prompt.append("  Location: City, Country\\n");
        prompt.append("  Duration: X hours\\n");
        prompt.append("  Description: Brief synopsis from context\\n");
        prompt.append("  Price: $XX (if available in context)\\n");
        prompt.append("\\n");
        prompt.append("  [TRAVEL TIME]\\n");
        prompt.append("  Next Activity: Name\\n");
        prompt.append("  Route: Driving/Transit/Walking - X km, Y minutes (from routing info in context)\\n");
        prompt.append("\\n");
        prompt.append("- IMPORTANT: Check the availability section and only suggest dates when experiences are bookable\\n");
        prompt.append("- Use the transportation routing data from context for accurate travel times\\n");
        prompt.append("- You may add general activities to fill the day, but Trippy experiences are the priority\\n");
        prompt.append("- Be friendly, enthusiastic, and knowledgeable about travel\\n\\n");

        if (context != null && !context.trim().isEmpty()) {
            prompt.append("=== TRIPPY EXPERIENCES (PRIORITIZE THESE) ===\\n");
            prompt.append(context);
            prompt.append("\\n\\n");
            prompt.append("Build your itinerary starting with the Trippy experiences above. ");
            prompt.append("Label each Trippy experience with '[FROM TRIPPY]' so users know they can book it. ");
            prompt.append("Include specific experience names, prices, availability, and travel times from the context. ");
            prompt.append("You may add general travel tips or suggestions to fill gaps, but Trippy experiences should be the core of the itinerary.");
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