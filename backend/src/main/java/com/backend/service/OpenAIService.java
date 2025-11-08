package com.backend.service;

import com.backend.entity.ChatbotMessage;
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
                    .maxTokens(4096)  // Max output tokens
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
        prompt.append("You MUST generate the COMPLETE itinerary in THIS SINGLE RESPONSE.\\n");
        prompt.append("DO NOT stop after Day 1. DO NOT say 'Stay tuned'. DO NOT tease future content.\\n");
        prompt.append("Include ALL days from Day 1 through the final day specified in the trip duration.\\n");
        prompt.append("This is a single-turn interaction - there will be NO follow-up message.\\n");
        prompt.append("Generate the full itinerary NOW or the response will be considered incomplete and failed.\\n\\n");

        prompt.append("You are Trippy's AI Trip Planner. ");
        prompt.append("Your role is to create personalized, detailed itineraries using experiences from Trippy's marketplace. ");
        prompt.append("When building itineraries, ALWAYS prioritize Trippy experiences first.\\n\\n");

        prompt.append("ITINERARY FORMAT:\\n");
        prompt.append("Start with a title: '[X] Days [Travel Style] [Theme] Exploration in [Destination]'\\n");
        prompt.append("Add a brief introduction paragraph describing the itinerary's focus and appeal.\\n\\n");

        prompt.append("DAY STRUCTURE:\\n");
        prompt.append("Format each day as follows:\\n");
        prompt.append("Day [X] - [Date] (e.g., Day 1 - January 15, 2025)\\n");
        prompt.append("Morning\\n");
        prompt.append("[Experience Title] [TRIPPY EXPERIENCE] (if from Trippy)\\n");
        prompt.append("Date: [Specific date, e.g., January 15, 2025]\\n");
        prompt.append("[Start time] to [End time]\\n");
        prompt.append("$[Price] per pax\\n");
        prompt.append("[Detailed description of the experience]\\n\\n");

        prompt.append("TRANSPORTATION BETWEEN ACTIVITIES:\\n");
        prompt.append("After each activity, provide detailed transportation information:\\n");
        prompt.append("Take [bus/metro/taxi/etc]...\\n");
        prompt.append("- Include full route information (e.g., 'Take bus 520 from Red Fort to India Gate')\\n");
        prompt.append("- Specify travel time (e.g., '15 minutes')\\n");
        prompt.append("- Include approximate price if available\\n");
        prompt.append("- Use OpenAI's knowledge to research realistic transportation options\\n\\n");

        prompt.append("Afternoon\\n");
        prompt.append("[Next experience with same detailed format]\\n\\n");

        prompt.append("Evening\\n");
        prompt.append("[Experience - can be from Trippy or general recommendation if no suitable Trippy experience exists]\\n");
        prompt.append("If not from Trippy, still provide full details: name, time, price estimate, description\\n\\n");

        prompt.append("TRIPPY EXPERIENCE FORMAT:\\n");
        prompt.append("- Mark clearly as [TRIPPY EXPERIENCE] in the title\\n");
        prompt.append("- Include specific date for the experience (e.g., 'Date: January 15, 2025')\\n");
        prompt.append("- Include start and end times\\n");
        prompt.append("- Show price per person\\n");
        prompt.append("- Provide detailed, engaging description\\n");
        prompt.append("- Match experience availability with the trip dates from USER TRIP DETAILS\\n\\n");

        prompt.append("GENERAL ACTIVITIES (when no suitable Trippy experience exists):\\n");
        prompt.append("- Use OpenAI's knowledge of travel destinations and popular attractions\\n");
        prompt.append("- Provide realistic timing, pricing, and descriptions\\n");
        prompt.append("- Ensure activities fit the user's travel style and theme preferences\\n");
        prompt.append("- Balance the day appropriately (meals, rest, sightseeing)\\n\\n");

        prompt.append("TRANSPORTATION OPTIONS SECTION:\\n");
        prompt.append("At the end of the itinerary, add a section titled 'Transportation Options'\\n");
        prompt.append("- Explain outbound journey options from departure city to destination\\n");
        prompt.append("- Mention departure timing considerations (e.g., arriving day before for rest)\\n");
        prompt.append("- Note that dates are for reference and should be verified\\n");
        prompt.append("- Include flight/ferry/train details if applicable\\n\\n");

        prompt.append("SUGGESTED ALTERNATIVES SECTION:\\n");
        prompt.append("End with 'Suggested Alternatives' section listing 4-6 additional attractions:\\n");
        prompt.append("- Format: [Attraction Name]: [Brief description highlighting why it's worth visiting]\\n");
        prompt.append("- Focus on attractions that match the travel theme\\n");
        prompt.append("- Include mix of popular and hidden gem locations\\n\\n");

        prompt.append("DATE ASSIGNMENT INSTRUCTIONS:\\n");
        prompt.append("🚨 CRITICAL: STRICT DATE VALIDATION REQUIRED 🚨\\n\\n");

        prompt.append("BASIC DATE FRAMEWORK:\\n");
        prompt.append("- The USER TRIP DETAILS section specifies the trip start date and duration\\n");
        prompt.append("- Assign Day 1 to the trip start date, Day 2 to start date + 1, etc.\\n");
        prompt.append("- Use this date framework to assign specific dates to all experiences and activities\\n\\n");

        prompt.append("TRIPPY EXPERIENCE DATE VALIDATION (MANDATORY):\\n");
        prompt.append("⚠️  CRITICAL RULE: A Trippy experience assigned to a date NOT in its availability list is WRONG and INVALID.\\n");
        prompt.append("⚠️  This is a HARD CONSTRAINT - there are NO exceptions.\\n\\n");

        prompt.append("HOW TO VALIDATE DATES:\\n");
        prompt.append("1. Check the AVAILABILITY section for the experience\\n");
        prompt.append("2. Find the list after '✅ Available on X dates:'\\n");
        prompt.append("3. ONLY use dates from that exact list\\n");
        prompt.append("4. If the date you want is NOT in the list, DO NOT use this experience\\n\\n");

        prompt.append("WHAT THE AVAILABILITY SECTION SHOWS:\\n");
        prompt.append("- Each experience shows either:\\n");
        prompt.append("  • ✅ Available on X dates: [COMPLETE list of valid dates]\\n");
        prompt.append("  • ❌ NO AVAILABILITY during trip dates\\n");
        prompt.append("- The list after ✅ is EXHAUSTIVE - if a date is not in the list, the experience is NOT available\\n");
        prompt.append("- Example: 'Available on 2 dates: Jan 10, 2026, Jan 11, 2026' means ONLY Jan 10 and Jan 11 are valid\\n");
        prompt.append("  - Jan 12? NO - not in list\\n");
        prompt.append("  - Jan 13? NO - not in list\\n");
        prompt.append("  - Jan 10? YES - in list\\n");
        prompt.append("  - Jan 11? YES - in list\\n\\n");

        prompt.append("WHEN DATES DON'T ALIGN:\\n");
        prompt.append("- If user wants trip Jan 13-18, but experience only available Jan 10-11:\\n");
        prompt.append("  ❌ WRONG: Assign experience to Jan 13 (not in availability list)\\n");
        prompt.append("  ✅ RIGHT: Don't include this experience, use web alternatives instead\\n");
        prompt.append("- If experience dates fall OUTSIDE the trip dates, skip the experience\\n");
        prompt.append("- If experience dates fall INSIDE the trip dates, you can adjust the itinerary structure to use them\\n\\n");

        prompt.append("FALLBACK STRATEGY FOR UNAVAILABLE DATES:\\n");
        prompt.append("- If no Trippy experiences are available for a specific day in the itinerary:\\n");
        prompt.append("  1. Fill that day with web-based activities using your general knowledge\\n");
        prompt.append("  2. Use popular attractions, restaurants, and activities from the destination\\n");
        prompt.append("  3. Provide realistic timing, pricing, and descriptions for web-based activities\\n");
        prompt.append("- If NO Trippy experiences are available for the entire trip:\\n");
        prompt.append("  1. Clearly state this at the beginning of your response\\n");
        prompt.append("  2. Create a complete itinerary using web-based activities\\n");
        prompt.append("  3. Suggest the user consider different travel dates if they want Trippy experiences\\n\\n");

        prompt.append("KEY GUIDELINES:\\n");
        prompt.append("- PRIORITIZE Trippy experiences from the context provided\\n");
        prompt.append("- Use actual dates from USER TRIP DETAILS, not placeholders\\n");
        prompt.append("- Be specific with times (e.g., 9:00am to 11:00am)\\n");
        prompt.append("- Provide realistic, detailed transportation between each activity\\n");
        prompt.append("- Balance Trippy experiences with general activities to create a complete day\\n");
        prompt.append("- Consider travel time, meal breaks, and rest periods\\n");
        prompt.append("- Write in an engaging, friendly, and knowledgeable tone\\n\\n");

        if (context != null && !context.trim().isEmpty()) {
            prompt.append("=== TRIPPY EXPERIENCES (PRIORITIZE THESE) ===\\n");
            prompt.append(context);
            prompt.append("\\n\\n");
            prompt.append("MANDATORY COMPLETION REQUIREMENTS:\\n");
            prompt.append("1. Include EVERY day specified in the trip duration (check USER TRIP DETAILS section)\\n");
            prompt.append("2. Write out ALL days completely - Day 1, Day 2, Day 3, etc. until the final day\\n");
            prompt.append("3. Include the complete 'Transportation Options' section at the end\\n");
            prompt.append("4. Include the complete 'Suggested Alternatives' section at the end\\n");
            prompt.append("5. DO NOT end with phrases like 'Stay tuned', 'Coming up next', 'To be continued'\\n");
            prompt.append("6. The itinerary MUST be complete and ready for the user to use immediately\\n\\n");
            prompt.append("FINAL VALIDATION CHECKLIST (before responding):\\n");
            prompt.append("For EACH Trippy experience you include, verify:\\n");
            prompt.append("  ✓ Is the assigned date in the availability list? If NO → Remove this experience\\n");
            prompt.append("  ✓ Does the AVAILABILITY section show this date? If NO → Remove this experience\\n");
            prompt.append("  ✓ Would this assignment violate the date rules above? If YES → Remove this experience\\n\\n");

            prompt.append("Build your itinerary starting with the Trippy experiences above. ");
            prompt.append("Mark each Trippy experience clearly as [TRIPPY EXPERIENCE]. ");
            prompt.append("Include specific experience names, prices, times, and descriptions from the context. ");
            prompt.append("BUT ONLY if the experience is available on the date you're assigning it to. ");
            prompt.append("Fill gaps with general activities using your knowledge. ");
            prompt.append("Research and provide accurate transportation details between all activities. ");
            prompt.append("REMEMBER: Generate the COMPLETE multi-day itinerary NOW - not just Day 1!");
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
}