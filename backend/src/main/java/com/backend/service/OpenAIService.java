package com.backend.service;

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
        prompt.append("- Format each activity with detailed timing and routing information\\n");
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
        prompt.append("- Include realistic start times for each activity\\n");
        prompt.append("- Use the transportation routing data from context for accurate travel times\\n");
        prompt.append("- Mention availability dates from context when suggesting when to book\\n");
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
        prompt.append("- PRIORITIZE experiences from Trippy (provided in context below)\\n");
        prompt.append("- Format each activity with detailed timing and routing information\\n");
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
        prompt.append("- Include realistic start times for each activity\\n");
        prompt.append("- Use the transportation routing data from context for accurate travel times\\n");
        prompt.append("- Mention availability dates from context when suggesting when to book\\n");
        prompt.append("- You may add general activities to fill the day, but Trippy experiences are the priority\\n");
        prompt.append("- Be friendly, enthusiastic, and knowledgeable about travel\\n\\n");

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
}