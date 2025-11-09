package com.backend.service;

import com.backend.dto.FAQSearchResult;
import com.backend.entity.FAQKnowledgeBase;
import com.backend.repository.FAQKnowledgeBaseRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class FAQKnowledgeBaseService {
    
    private static final Logger logger = LoggerFactory.getLogger(FAQKnowledgeBaseService.class);
    
    @Autowired
    private FAQKnowledgeBaseRepository faqKnowledgeBaseRepository;
    
    @Autowired(required = false)
    private OpenAIService openAIService;
    
    @Value("${chatbot.similarity.threshold:0.2}")
    private Double similarityThreshold;
    
    @Value("${chatbot.max.results}")
    private Integer maxResults;
    
    @Value("${chatbot.use.openai.embeddings:true}")
    private Boolean useOpenAIEmbeddings;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern WORD_PATTERN = Pattern.compile("\\b\\w+\\b");
    
    /**
     * Search for similar FAQs with confidence scores using database-level vector similarity search
     * Uses PostgreSQL vector similarity (same approach as experience recommender) for high accuracy
     * @param query User query text
     * @return List of FAQSearchResult objects with confidence scores, sorted by confidence (highest first)
     */
    public List<FAQSearchResult> searchSimilarFAQsWithConfidence(String query) {
        logger.info("Searching for similar FAQs with confidence scores for query: '{}'", query);
        
        try {
            // Generate OpenAI embedding for the query
            List<Double> queryEmbedding = null;
            if (useOpenAIEmbeddings && openAIService != null) {
                try {
                    logger.debug("Generating OpenAI embedding for query: '{}'", query);
                    queryEmbedding = openAIService.generateEmbedding(query);
                    if (queryEmbedding == null || queryEmbedding.isEmpty()) {
                        logger.warn("OpenAI embedding generation failed (null or empty), falling back to TF-IDF");
                        queryEmbedding = null;
                    } else {
                        logger.debug("Successfully generated embedding with {} dimensions", queryEmbedding.size());
                    }
                } catch (Exception e) {
                    logger.warn("Error generating OpenAI embedding: {}. Falling back to TF-IDF", e.getMessage());
                    queryEmbedding = null;
                }
            } else {
                logger.warn("OpenAI embeddings disabled or service unavailable. useOpenAIEmbeddings={}, openAIService={}", 
                    useOpenAIEmbeddings, openAIService != null);
            }
            
            // Use database-level vector similarity search if embeddings are available
            if (queryEmbedding != null) {
                // Try progressive thresholds: 0.35 (primary), then 0.5 (fallback), then TF-IDF
                double[] thresholds = {similarityThreshold, 0.5};
                String[] thresholdNames = {"primary", "relaxed"};
                
                for (int i = 0; i < thresholds.length; i++) {
                    double currentThreshold = thresholds[i];
                    String thresholdName = thresholdNames[i];
                    
                    try {
                        // Convert embedding to PostgreSQL vector format: [0.1,0.2,0.3,...]
                        String embeddingVector = formatEmbeddingForPostgres(queryEmbedding);
                        
                        logger.debug("Attempting vector search with {} threshold: {}", thresholdName, currentThreshold);
                        
                        // Get FAQs first
                        List<FAQKnowledgeBase> results = faqKnowledgeBaseRepository.findSimilarDocumentsByVector(
                            embeddingVector,
                            currentThreshold,
                            maxResults * 2
                        );
                        
                        if (!results.isEmpty()) {
                            // Calculate similarity scores for each result and apply keyword boosting
                            List<FAQSearchResult> searchResults = new ArrayList<>();
                            
                            // Extract key terms from query for boosting
                            List<String> queryKeyTerms = extractKeyTerms(query);
                            
                            for (FAQKnowledgeBase faq : results) {
                                try {
                                    // Get actual similarity score from database
                                    Double similarityScore = faqKnowledgeBaseRepository.getSimilarityScore(
                                        faq.getKnowledgeId(), 
                                        embeddingVector
                                    );
                                    if (similarityScore == null) {
                                        // Fallback: use threshold as approximation
                                        similarityScore = currentThreshold * 0.8;
                                    }
                                    
                                    // Apply keyword boost for exact matches
                                    double keywordBoost = calculateKeywordBoost(query, queryKeyTerms, faq);
                                    // Reduce similarity score (distance) by boost amount (boost reduces distance)
                                    double adjustedScore = Math.max(0.0, similarityScore - keywordBoost);
                                    
                                    logger.debug("FAQ {}: original_score={}, keyword_boost={}, adjusted_score={}", 
                                        faq.getKnowledgeId(), similarityScore, keywordBoost, adjustedScore);
                                    
                                    searchResults.add(new FAQSearchResult(faq, adjustedScore));
                                } catch (Exception e) {
                                    logger.warn("Error getting similarity score for FAQ {}: {}", 
                                        faq.getKnowledgeId(), e.getMessage());
                                    // Fallback: use threshold as approximation
                                    searchResults.add(new FAQSearchResult(faq, currentThreshold * 0.8));
                                }
                            }
                            
                            if (!searchResults.isEmpty()) {
                                logger.info("Found {} similar FAQs using vector search ({} threshold: {}) for query: '{}'", 
                                    searchResults.size(), thresholdName, currentThreshold, query);
                                // Sort by confidence (higher is better)
                                searchResults.sort((a, b) -> Double.compare(b.getConfidence(), a.getConfidence()));
                                return searchResults;
                            }
                        } else {
                            logger.debug("No vector search results found with {} threshold: {} for query: '{}'", 
                                thresholdName, currentThreshold, query);
                        }
                    } catch (Exception e) {
                        logger.warn("Vector search failed with {} threshold {}: {}. Trying next threshold or TF-IDF", 
                            thresholdName, currentThreshold, e.getMessage(), e);
                    }
                }
                
                logger.warn("Vector search returned no results with any threshold for query: '{}'. Falling back to TF-IDF", query);
            } else {
                logger.warn("No query embedding available for query: '{}'. Falling back to TF-IDF", query);
            }
            
            // Fallback to TF-IDF if vector search is not available or returns no results
            logger.info("Using TF-IDF fallback search for query: '{}'", query);
            List<FAQKnowledgeBase> fallbackResults = searchSimilarFAQsFallback(query);
            // Convert to FAQSearchResult with low confidence
            return fallbackResults.stream()
                .map(faq -> new FAQSearchResult(faq, 0.6)) // Low confidence for TF-IDF results
                .collect(Collectors.toList());
            
        } catch (Exception e) {
            logger.error("Error searching for similar FAQs: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Search for similar FAQs using database-level vector similarity search
     * Uses PostgreSQL vector similarity (same approach as experience recommender) for high accuracy
     * @param query User query text
     * @return List of FAQs sorted by similarity score (highest first)
     */
    public List<FAQKnowledgeBase> searchSimilarFAQs(String query) {
        logger.info("Searching for similar FAQs for query: '{}'", query);
        
        try {
            // Generate OpenAI embedding for the query
            List<Double> queryEmbedding = null;
            if (useOpenAIEmbeddings && openAIService != null) {
                try {
                    logger.debug("Generating OpenAI embedding for query: '{}'", query);
                    queryEmbedding = openAIService.generateEmbedding(query);
                    if (queryEmbedding == null || queryEmbedding.isEmpty()) {
                        logger.warn("OpenAI embedding generation failed (null or empty), falling back to TF-IDF");
                        queryEmbedding = null;
                    } else {
                        logger.debug("Successfully generated embedding with {} dimensions", queryEmbedding.size());
                    }
                } catch (Exception e) {
                    logger.warn("Error generating OpenAI embedding: {}. Falling back to TF-IDF", e.getMessage());
                    queryEmbedding = null;
                }
            } else {
                logger.warn("OpenAI embeddings disabled or service unavailable. useOpenAIEmbeddings={}, openAIService={}", 
                    useOpenAIEmbeddings, openAIService != null);
            }
            
            // Use database-level vector similarity search if embeddings are available
            if (queryEmbedding != null) {
                // Try progressive thresholds: 0.35 (primary), then 0.5 (fallback), then TF-IDF
                double[] thresholds = {similarityThreshold, 0.5};
                String[] thresholdNames = {"primary", "relaxed"};
                
                for (int i = 0; i < thresholds.length; i++) {
                    double currentThreshold = thresholds[i];
                    String thresholdName = thresholdNames[i];
                    
                    try {
                        // Convert embedding to PostgreSQL vector format: [0.1,0.2,0.3,...]
                        String embeddingVector = formatEmbeddingForPostgres(queryEmbedding);
                        
                        logger.debug("Attempting vector search with {} threshold: {}", thresholdName, currentThreshold);
                        
                        // Use database-level vector similarity search (same as experience recommender)
                        List<FAQKnowledgeBase> results = faqKnowledgeBaseRepository.findSimilarDocumentsByVector(
                            embeddingVector,
                            currentThreshold,
                            maxResults
                        );
                        
                        if (!results.isEmpty()) {
                            logger.info("Found {} similar FAQs using vector search ({} threshold: {}) for query: '{}'", 
                                results.size(), thresholdName, currentThreshold, query);
                            logger.debug("Top result: knowledge_id={}, category={}", 
                                results.get(0).getKnowledgeId(), 
                                results.get(0).getCategory());
                            return results;
                        } else {
                            logger.debug("No vector search results found with {} threshold: {} for query: '{}'", 
                                thresholdName, currentThreshold, query);
                        }
                    } catch (Exception e) {
                        logger.warn("Vector search failed with {} threshold {}: {}. Trying next threshold or TF-IDF", 
                            thresholdName, currentThreshold, e.getMessage(), e);
                    }
                }
                
                logger.warn("Vector search returned no results with any threshold for query: '{}'. Falling back to TF-IDF", query);
            } else {
                logger.warn("No query embedding available for query: '{}'. Falling back to TF-IDF", query);
            }
            
            // Fallback to TF-IDF if vector search is not available or returns no results
            logger.info("Using TF-IDF fallback search for query: '{}'", query);
            return searchSimilarFAQsFallback(query);
            
        } catch (Exception e) {
            logger.error("Error searching for similar FAQs: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Fallback TF-IDF search method (kept for backward compatibility)
     * Used when vector search is unavailable or returns no results
     */
    private List<FAQKnowledgeBase> searchSimilarFAQsFallback(String query) {
        logger.debug("Starting TF-IDF fallback search for query: '{}'", query);
        
        try {
            // Get all FAQs from knowledge base
            List<FAQKnowledgeBase> allFAQs = faqKnowledgeBaseRepository.findBySourceType("faq");
            
            logger.debug("Retrieved {} FAQs from knowledge base for TF-IDF search", allFAQs.size());
            
            if (allFAQs.isEmpty()) {
                logger.warn("No FAQs found in knowledge base");
                return new ArrayList<>();
            }
            
            // Tokenize and normalize query
            Map<String, Double> queryVector = buildQueryVector(query, allFAQs);
            List<String> queryTermsList = tokenizeAndNormalize(query);
            Set<String> queryTerms = new HashSet<>(queryTermsList);
            
            logger.debug("Query tokenized into {} terms: {}", queryTerms.size(), queryTerms);
            
            if (queryVector.isEmpty() && queryTerms.isEmpty()) {
                logger.warn("Query vector is empty after tokenization for query: '{}'", query);
                return new ArrayList<>();
            }
            
            // Calculate similarity scores for each FAQ
            List<FAQWithSimilarity> faqsWithSimilarity = new ArrayList<>();
            
            for (FAQKnowledgeBase faq : allFAQs) {
                // Calculate multiple similarity scores
                double exactPhraseSimilarity = calculateExactPhraseSimilarity(query.toLowerCase(), faq);
                double tfidfSimilarity = calculateCosineSimilarity(queryVector, faq);
                double keywordSimilarity = calculateKeywordSimilarity(queryTerms, faq);
                double contentSimilarity = calculateContentSimilarity(query.toLowerCase(), faq.getContent().toLowerCase());
                
                // Weighted combination: exact phrase matches get highest priority
                double similarity = Math.max(
                    exactPhraseSimilarity * 1.5,  // Boost exact phrase matches
                    Math.max(
                        contentSimilarity * 1.2,   // Boost content similarity
                        Math.max(tfidfSimilarity * 1.3, keywordSimilarity)  // Boost semantic similarity
                    )
                );
                
                // Cap at 1.0
                similarity = Math.min(similarity, 1.0);
                
                if (similarity >= similarityThreshold) {
                    faqsWithSimilarity.add(new FAQWithSimilarity(faq, similarity));
                    logger.debug("FAQ {} matched with similarity {} (exact={}, tfidf={}, keyword={}, content={})", 
                        faq.getKnowledgeId(), similarity, exactPhraseSimilarity, tfidfSimilarity, keywordSimilarity, contentSimilarity);
                }
            }
            
            // If no matches found with TF-IDF, try keyword matching with lower threshold
            if (faqsWithSimilarity.isEmpty()) {
                logger.warn("No matches found with TF-IDF threshold {} for query: '{}'. Trying keyword matching with lower threshold (0.1)", 
                    similarityThreshold, query);
                for (FAQKnowledgeBase faq : allFAQs) {
                    double keywordSimilarity = calculateKeywordSimilarity(queryTerms, faq);
                    if (keywordSimilarity >= 0.1) { // Lower threshold for keyword matching
                        faqsWithSimilarity.add(new FAQWithSimilarity(faq, keywordSimilarity));
                        logger.debug("FAQ {} matched via keyword similarity: {}", faq.getKnowledgeId(), keywordSimilarity);
                    }
                }
            }
            
            // Sort by similarity (highest first) and limit results
            List<FAQKnowledgeBase> results = faqsWithSimilarity.stream()
                    .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                    .limit(maxResults)
                    .map(f -> f.faq)
                    .collect(Collectors.toList());
            
            if (!results.isEmpty()) {
                logger.info("Found {} similar FAQs using TF-IDF fallback for query: '{}' (top similarity: {})", 
                    results.size(), query, faqsWithSimilarity.get(0).similarity);
            } else {
                logger.warn("TF-IDF fallback returned no results for query: '{}'", query);
            }
            
            return results;
            
        } catch (Exception e) {
            logger.error("Error in TF-IDF fallback search for query '{}': {}", query, e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Format embedding list as PostgreSQL vector string
     * Converts List<Double> to format: [0.1,0.2,0.3,...]
     */
    private String formatEmbeddingForPostgres(List<Double> embedding) {
        return embedding.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));
    }
    
    /**
     * Build TF-IDF vector for user query
     * Uses terms from stored FAQs to build vocabulary
     */
    private Map<String, Double> buildQueryVector(String query, List<FAQKnowledgeBase> allFAQs) {
        // Tokenize and normalize query
        List<String> queryTerms = tokenizeAndNormalize(query);
        
        if (queryTerms.isEmpty()) {
            return new HashMap<>();
        }
        
        // Count term frequencies in query
        Map<String, Integer> termFreq = new HashMap<>();
        for (String term : queryTerms) {
            termFreq.put(term, termFreq.getOrDefault(term, 0) + 1);
        }
        
        // Build query vector using TF (term frequency) only
        // Since we don't have IDF for query, we'll use normalized TF
        Map<String, Double> queryVector = new HashMap<>();
        int maxFreq = termFreq.values().stream().max(Integer::compare).orElse(1);
        
        for (Map.Entry<String, Integer> entry : termFreq.entrySet()) {
            // Simple TF normalization
            double tf = 0.5 + 0.5 * (entry.getValue().doubleValue() / maxFreq);
            queryVector.put(entry.getKey(), tf);
        }
        
        return queryVector;
    }
    
    /**
     * Calculate cosine similarity between query vector and FAQ vector
     */
    private double calculateCosineSimilarity(Map<String, Double> queryVector, FAQKnowledgeBase faq) {
        try {
            // Parse vectorized_content from FAQ
            String vectorizedContent = faq.getVectorizedContent();
            if (vectorizedContent == null || vectorizedContent.trim().isEmpty()) {
                return 0.0;
            }
            
            Map<String, Double> faqVector = objectMapper.readValue(
                vectorizedContent, 
                new TypeReference<Map<String, Double>>() {}
            );
            
            if (faqVector.isEmpty()) {
                return 0.0;
            }
            
            // Calculate dot product
            double dotProduct = 0.0;
            for (Map.Entry<String, Double> entry : queryVector.entrySet()) {
                String term = entry.getKey();
                if (faqVector.containsKey(term)) {
                    dotProduct += entry.getValue() * faqVector.get(term);
                }
            }
            
            // Calculate norms
            double queryNorm = Math.sqrt(
                queryVector.values().stream()
                    .mapToDouble(v -> v * v)
                    .sum()
            );
            
            double faqNorm = Math.sqrt(
                faqVector.values().stream()
                    .mapToDouble(v -> v * v)
                    .sum()
            );
            
            // Cosine similarity
            if (queryNorm == 0.0 || faqNorm == 0.0) {
                return 0.0;
            }
            
            return dotProduct / (queryNorm * faqNorm);
            
        } catch (Exception e) {
            logger.error("Error calculating similarity for FAQ {}: {}", faq.getKnowledgeId(), e.getMessage());
            return 0.0;
        }
    }
    
    /**
     * Calculate exact phrase similarity - checks if query appears in FAQ content
     * Handles question variations and extracts key terms
     */
    private double calculateExactPhraseSimilarity(String query, FAQKnowledgeBase faq) {
        String content = faq.getContent().toLowerCase();
        String normalizedQuery = query.trim().toLowerCase();
        
        // Extract question part (first sentence before answer)
        String firstSentence = content.split("[.!?]")[0].trim();
        
        // Exact match bonus
        if (firstSentence.equals(normalizedQuery)) {
            return 1.0;
        }
        
        // Remove question words for better matching
        Set<String> questionWords = Set.of("what", "how", "when", "where", "who", "why", "can", "do", "does", "is", "are", "will", "would", "should", "could");
        List<String> queryWords = tokenizeAndNormalize(query);
        List<String> faqWords = tokenizeAndNormalize(firstSentence);
        
        // Extract key terms (non-question words)
        List<String> queryKeyTerms = queryWords.stream()
            .filter(word -> !questionWords.contains(word) && word.length() > 2)
            .collect(Collectors.toList());
        List<String> faqKeyTerms = faqWords.stream()
            .filter(word -> !questionWords.contains(word) && word.length() > 2)
            .collect(Collectors.toList());
        
        // If all key terms from query appear in FAQ, high score
        if (!queryKeyTerms.isEmpty()) {
            Set<String> faqKeyTermsSet = new HashSet<>(faqKeyTerms);
            long matchingKeyTerms = queryKeyTerms.stream()
                .filter(faqKeyTermsSet::contains)
                .count();
            
            double keyTermRatio = (double) matchingKeyTerms / queryKeyTerms.size();
            if (keyTermRatio >= 0.8 && matchingKeyTerms >= 2) {
                return 0.9; // Very high score for key term matches
            } else if (keyTermRatio >= 0.6 && matchingKeyTerms >= 1) {
                return 0.7; // High score for partial key term matches
            }
        }
        
        // Check if query contains the question or vice versa
        if (firstSentence.contains(normalizedQuery) || normalizedQuery.contains(firstSentence)) {
            return 0.8;
        }
        
        // Check for significant substring overlap
        int commonSubstring = findLongestCommonSubstring(normalizedQuery, firstSentence);
        if (commonSubstring >= 10) {
            double ratio = (double) commonSubstring / Math.max(normalizedQuery.length(), firstSentence.length());
            return 0.6 + (0.2 * ratio);
        }
        
        // Check if query words appear in same order in FAQ (with some flexibility)
        if (!queryWords.isEmpty() && !faqWords.isEmpty()) {
            int matches = 0;
            int queryIndex = 0;
            for (String faqWord : faqWords) {
                if (queryIndex < queryWords.size() && faqWord.equals(queryWords.get(queryIndex))) {
                    matches++;
                    queryIndex++;
                }
            }
            
            double orderMatchRatio = (double) matches / queryWords.size();
            if (orderMatchRatio >= 0.7 && matches >= 3) {
                return 0.75; // High score for ordered word match
            } else if (orderMatchRatio >= 0.5 && matches >= 2) {
                return 0.5;
            }
        }
        
        return 0.0;
    }
    
    /**
     * Find longest common substring between two strings
     */
    private int findLongestCommonSubstring(String s1, String s2) {
        int maxLen = 0;
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    maxLen = Math.max(maxLen, dp[i][j]);
                }
            }
        }
        
        return maxLen;
    }
    
    /**
     * Calculate content-based similarity using substring matching
     * Prioritizes key terms over question words
     */
    private double calculateContentSimilarity(String query, String content) {
        if (query == null || content == null || query.isEmpty() || content.isEmpty()) {
            return 0.0;
        }
        
        // Check if query is a substring of content
        if (content.contains(query)) {
            return 0.6 + (0.2 * (query.length() / content.length())); // Boost for longer matches
        }
        
        // Extract key terms (remove common question words)
        Set<String> questionWords = Set.of("what", "how", "when", "where", "who", "why", "can", "do", "does", 
            "is", "are", "will", "would", "should", "could", "i", "you", "use", "the", "a", "an");
        
        // Check for significant word overlap in first sentence (likely the question)
        String firstPart = content.length() > 200 ? content.substring(0, 200) : content;
        List<String> queryWords = tokenizeAndNormalize(query);
        List<String> contentWords = tokenizeAndNormalize(firstPart);
        
        if (queryWords.isEmpty() || contentWords.isEmpty()) {
            return 0.0;
        }
        
        // Filter out question words and common words to get key terms
        List<String> queryKeyTerms = queryWords.stream()
            .filter(word -> !questionWords.contains(word) && word.length() > 2)
            .collect(Collectors.toList());
        List<String> contentKeyTerms = contentWords.stream()
            .filter(word -> !questionWords.contains(word) && word.length() > 2)
            .collect(Collectors.toList());
        
        if (queryKeyTerms.isEmpty() || contentKeyTerms.isEmpty()) {
            // Fallback to all words if no key terms
            queryKeyTerms = queryWords;
            contentKeyTerms = contentWords;
        }
        
        Set<String> querySet = new HashSet<>(queryKeyTerms);
        Set<String> contentSet = new HashSet<>(contentKeyTerms);
        
        // Calculate overlap
        Set<String> intersection = new HashSet<>(querySet);
        intersection.retainAll(contentSet);
        
        if (intersection.isEmpty()) {
            return 0.0;
        }
        
        // Weighted similarity based on overlap percentage of key terms
        double overlapRatio = (double) intersection.size() / querySet.size();
        
        // Boost if most important words match (especially key terms)
        if (overlapRatio >= 0.8 && intersection.size() >= 2) {
            return 0.7; // Very high score for key term matches
        } else if (overlapRatio >= 0.7 && intersection.size() >= 3) {
            return 0.6;
        } else if (overlapRatio >= 0.5 && intersection.size() >= 2) {
            return 0.4;
        }
        
        return 0.2 * overlapRatio;
    }
    
    /**
     * Calculate keyword-based similarity (Jaccard similarity)
     */
    private double calculateKeywordSimilarity(Set<String> queryTerms, FAQKnowledgeBase faq) {
        if (queryTerms.isEmpty()) {
            return 0.0;
        }
        
        // Get terms from FAQ content (prioritize first part which is usually the question)
        String content = faq.getContent();
        String questionPart = content.length() > 150 ? content.substring(0, 150) : content;
        Set<String> faqTerms = new HashSet<>(tokenizeAndNormalize(questionPart));
        
        // Also check keywords if available
        if (faq.getKeywords() != null && !faq.getKeywords().trim().isEmpty()) {
            String[] keywords = faq.getKeywords().split(",");
            for (String keyword : keywords) {
                faqTerms.add(keyword.trim().toLowerCase());
            }
        }
        
        if (faqTerms.isEmpty()) {
            return 0.0;
        }
        
        // Calculate Jaccard similarity (intersection over union)
        Set<String> intersection = new HashSet<>(queryTerms);
        intersection.retainAll(faqTerms);
        
        Set<String> union = new HashSet<>(queryTerms);
        union.addAll(faqTerms);
        
        if (union.isEmpty()) {
            return 0.0;
        }
        
        double jaccard = (double) intersection.size() / union.size();
        
        // Boost score if significant overlap
        if (intersection.size() >= 2) {
            jaccard *= 1.3; // Boost for multiple matching terms
        }
        
        return Math.min(jaccard, 1.0);
    }
    
    /**
     * Extract key terms from query (excluding common question words)
     */
    private List<String> extractKeyTerms(String query) {
        Set<String> stopWords = Set.of("what", "is", "are", "the", "your", "my", "how", "when", "where", 
            "who", "why", "can", "do", "does", "will", "would", "should", "could", "a", "an", "to", "for");
        
        List<String> terms = tokenizeAndNormalize(query);
        return terms.stream()
            .filter(term -> !stopWords.contains(term) && term.length() > 2)
            .collect(Collectors.toList());
    }
    
    /**
     * Calculate keyword boost for exact matches
     * Returns a boost value (0.0 to 0.3) that reduces the similarity distance score
     * Higher boost = better match = lower distance = higher confidence
     */
    private double calculateKeywordBoost(String query, List<String> queryKeyTerms, FAQKnowledgeBase faq) {
        if (queryKeyTerms.isEmpty()) {
            return 0.0;
        }
        
        String queryLower = query.toLowerCase();
        String faqContent = faq.getContent().toLowerCase();
        String faqQuestion = faqContent.split("[.!?]")[0].toLowerCase();
        
        // Define synonym groups for better matching
        Map<String, Set<String>> synonymGroups = Map.of(
            "earn", Set.of("earn", "get", "obtain", "receive", "gain", "acquire"),
            "use", Set.of("use", "apply", "spend", "redeem"),
            "cancel", Set.of("cancel", "cancellation", "cancelled"),
            "refund", Set.of("refund", "refunded", "reimburse")
        );
        
        // Check for exact phrase matches (highest boost)
        if (faqQuestion.contains(queryLower) || queryLower.contains(faqQuestion)) {
            logger.debug("Exact phrase match found for FAQ {}", faq.getKnowledgeId());
            return 0.3; // Strong boost for exact phrase
        }
        
        // Check for action verb matches with synonyms (very important for "earn" vs "get")
        // This ensures "how do i get trippoints" matches "How do I earn TripPoints?" not "What are TripPoints?"
        for (Map.Entry<String, Set<String>> synonymGroup : synonymGroups.entrySet()) {
            String primaryTerm = synonymGroup.getKey();
            Set<String> synonyms = synonymGroup.getValue();
            
            // Check if query contains any synonym
            boolean queryHasSynonym = synonyms.stream().anyMatch(queryLower::contains);
            
            if (queryHasSynonym) {
                // Check if FAQ question contains the primary term or any synonym
                boolean faqHasTerm = faqQuestion.contains(primaryTerm) || 
                    synonyms.stream().anyMatch(faqQuestion::contains);
                
                if (faqHasTerm) {
                    // Very strong boost for action verb matches
                    // This prioritizes action-specific FAQs over general ones
                    logger.debug("Action verb match found for FAQ {}: query has {}, FAQ has {}", 
                        faq.getKnowledgeId(), synonyms, primaryTerm);
                    return 0.28; // Very strong boost for action verb matches (higher than general matches)
                } else {
                    // If query asks about an action but FAQ doesn't have that action, reduce boost
                    // This helps avoid matching "how do i get trippoints" to "What are TripPoints?"
                    logger.debug("Query asks about {} but FAQ {} doesn't contain it, no boost", 
                        primaryTerm, faq.getKnowledgeId());
                    // Don't return here, let other checks handle it, but this prevents over-boosting
                }
            }
        }
        
        // Check for all key terms present (strong boost)
        long matchingTerms = queryKeyTerms.stream()
            .filter(term -> {
                // Check direct match
                if (faqQuestion.contains(term) || faqContent.contains(term)) {
                    return true;
                }
                // Check synonym match
                for (Map.Entry<String, Set<String>> synonymGroup : synonymGroups.entrySet()) {
                    Set<String> synonyms = synonymGroup.getValue();
                    if (synonyms.contains(term)) {
                        // Check if FAQ contains any synonym from this group
                        return synonyms.stream().anyMatch(syn -> 
                            faqQuestion.contains(syn) || faqContent.contains(syn));
                    }
                }
                return false;
            })
            .count();
        
        if (matchingTerms == queryKeyTerms.size() && queryKeyTerms.size() >= 2) {
            logger.debug("All key terms matched for FAQ {}: {}", faq.getKnowledgeId(), queryKeyTerms);
            return 0.25; // Very strong boost
        }
        
        // Check for most key terms present (medium boost)
        double matchRatio = (double) matchingTerms / queryKeyTerms.size();
        if (matchRatio >= 0.8 && matchingTerms >= 2) {
            logger.debug("Most key terms matched for FAQ {}: {}/{}", faq.getKnowledgeId(), matchingTerms, queryKeyTerms.size());
            return 0.15; // Medium boost
        }
        
        // Check for important terms (specific boost for cancellation vs refund)
        // If query contains "cancellation", boost FAQs with "cancellation" more than "refund"
        if (queryLower.contains("cancellation") || queryLower.contains("cancel")) {
            if (faqQuestion.contains("cancellation") || faqQuestion.contains("cancel")) {
                logger.debug("Cancellation keyword match for FAQ {}", faq.getKnowledgeId());
                return 0.2; // Boost for exact cancellation match
            } else if (faqQuestion.contains("refund")) {
                // Don't boost refund FAQs when user asks about cancellation
                return 0.0;
            }
        }
        
        // If query contains "refund", boost FAQs with "refund"
        if (queryLower.contains("refund")) {
            if (faqQuestion.contains("refund")) {
                logger.debug("Refund keyword match for FAQ {}", faq.getKnowledgeId());
                return 0.2; // Boost for exact refund match
            }
        }
        
        // Partial match boost
        if (matchRatio >= 0.5 && matchingTerms >= 1) {
            return 0.05; // Small boost
        }
        
        return 0.0;
    }
    
    /**
     * Calculate cosine similarity using OpenAI embeddings
     * Checks if FAQ has embedding stored in metadata or vectorized_content
     */
    private double calculateEmbeddingSimilarity(List<Double> queryEmbedding, FAQKnowledgeBase faq) {
        try {
            // Try to get embedding from metadata first
            List<Double> faqEmbedding = extractEmbeddingFromMetadata(faq);
            
            if (faqEmbedding == null || faqEmbedding.isEmpty()) {
                logger.debug("No embedding found for FAQ {}, skipping embedding similarity", faq.getKnowledgeId());
                return 0.0;
            }
            
            if (faqEmbedding.size() != queryEmbedding.size()) {
                logger.warn("Embedding size mismatch: query={}, FAQ={}", queryEmbedding.size(), faqEmbedding.size());
                return 0.0;
            }
            
            // Calculate cosine similarity
            double dotProduct = 0.0;
            double queryNorm = 0.0;
            double faqNorm = 0.0;
            
            for (int i = 0; i < queryEmbedding.size(); i++) {
                double q = queryEmbedding.get(i);
                double f = faqEmbedding.get(i);
                dotProduct += q * f;
                queryNorm += q * q;
                faqNorm += f * f;
            }
            
            queryNorm = Math.sqrt(queryNorm);
            faqNorm = Math.sqrt(faqNorm);
            
            if (queryNorm == 0.0 || faqNorm == 0.0) {
                return 0.0;
            }
            
            return dotProduct / (queryNorm * faqNorm);
            
        } catch (Exception e) {
            logger.error("Error calculating embedding similarity for FAQ {}: {}", faq.getKnowledgeId(), e.getMessage());
            return 0.0;
        }
    }
    
    /**
     * Extract embedding from FAQ
     * Checks embedding column first, then metadata field
     */
    private List<Double> extractEmbeddingFromMetadata(FAQKnowledgeBase faq) {
        try {
            // First check the dedicated embedding column (JSONB)
            String embeddingJson = faq.getEmbedding();
            if (embeddingJson != null && !embeddingJson.trim().isEmpty()) {
                Object embeddingObj = objectMapper.readValue(embeddingJson, Object.class);
                List<Double> embedding = parseEmbedding(embeddingObj);
                if (embedding != null && !embedding.isEmpty()) {
                    return embedding;
                }
            }
            
            // Fallback: check metadata field (JSONB)
            String metadata = faq.getMetadata();
            if (metadata != null && !metadata.trim().isEmpty()) {
                Map<String, Object> metadataMap = objectMapper.readValue(metadata, new TypeReference<Map<String, Object>>() {});
                
                // Check if embedding is directly in metadata
                if (metadataMap.containsKey("embedding")) {
                    Object embeddingObj = metadataMap.get("embedding");
                    return parseEmbedding(embeddingObj);
                }
            }
            
            return null;
            
        } catch (Exception e) {
            logger.debug("Could not extract embedding for FAQ {}: {}", faq.getKnowledgeId(), e.getMessage());
            return null;
        }
    }
    
    /**
     * Parse embedding from various formats
     */
    private List<Double> parseEmbedding(Object embeddingObj) {
        try {
            if (embeddingObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Object> rawList = (List<Object>) embeddingObj;
                return rawList.stream()
                    .map(obj -> {
                        if (obj instanceof Number) {
                            return ((Number) obj).doubleValue();
                        } else if (obj instanceof String) {
                            return Double.parseDouble((String) obj);
                        }
                        return null;
                    })
                    .filter(d -> d != null)
                    .collect(Collectors.toList());
            } else if (embeddingObj instanceof String) {
                // Parse JSON string
                return objectMapper.readValue((String) embeddingObj, new TypeReference<List<Double>>() {});
            }
            return null;
        } catch (Exception e) {
            logger.debug("Error parsing embedding: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Tokenize and normalize text
     */
    private List<String> tokenizeAndNormalize(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        return WORD_PATTERN.matcher(text.toLowerCase())
                .results()
                .map(m -> m.group())
                .filter(word -> word.length() > 2) // Filter out very short words
                .collect(Collectors.toList());
    }
    
    /**
     * Helper class to store FAQ with similarity score
     */
    private static class FAQWithSimilarity {
        FAQKnowledgeBase faq;
        double similarity;
        
        FAQWithSimilarity(FAQKnowledgeBase faq, double similarity) {
            this.faq = faq;
            this.similarity = similarity;
        }
    }
}

