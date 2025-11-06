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
    
    // Build the system prompt for the chatbot
    private String buildSystemPrompt(String context) { 
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
            prompt.append("Here's relevant information from our knowledge base to help answer the user's question:\\n");
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
            prompt.append("No specific context available. Provide general travel assistance and ask clarifying questions to better help the user.");
        }
        
        return prompt.toString();
    }
}