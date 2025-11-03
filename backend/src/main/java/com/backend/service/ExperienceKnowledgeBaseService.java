package com.backend.service;

import com.backend.entity.ExperienceKnowledgeBaseDocument;
import com.backend.repository.ExperienceKnowledgeBaseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExperienceKnowledgeBaseService {
    
    private static final Logger logger = LoggerFactory.getLogger(ExperienceKnowledgeBaseService.class);
    
    @Autowired
    private ExperienceKnowledgeBaseRepository experienceKnowledgeBaseRepository;
    
    @Autowired
    private OpenAIService openAIService;
    
    @Value("${chatbot.similarity.threshold}")
    private Double similarityThreshold;
    
    @Value("${chatbot.max.results}")
    private Integer maxResults;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public List<ExperienceKnowledgeBaseDocument> searchSimilarDocuments(String query) {
        try {
            // Generate embedding for the query
            List<Double> queryEmbedding = openAIService.generateEmbedding(query);
            
            if (queryEmbedding == null || queryEmbedding.isEmpty()) {
                logger.error("Failed to generate embedding for query: {}", query);
                return new ArrayList<>();
            }
            
            // Convert embedding to PostgreSQL vector format
            String embeddingVector = formatEmbeddingForPostgres(queryEmbedding);
            
            // Search for similar documents
            return experienceKnowledgeBaseRepository.findSimilarDocuments(
                embeddingVector, 
                similarityThreshold, 
                maxResults
            );
            
        } catch (Exception e) {
            logger.error("Error searching for similar documents: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    public List<ExperienceKnowledgeBaseDocument> searchSimilarDocumentsByType(String query, String documentType) {
        try {
            List<Double> queryEmbedding = openAIService.generateEmbedding(query);
            
            if (queryEmbedding == null || queryEmbedding.isEmpty()) {
                logger.error("Failed to generate embedding for query: {}", query);
                return new ArrayList<>();
            }
            
            String embeddingVector = formatEmbeddingForPostgres(queryEmbedding);
            
            return experienceKnowledgeBaseRepository.findSimilarDocumentsByType(
                embeddingVector, 
                documentType,
                similarityThreshold, 
                maxResults
            );
            
        } catch (Exception e) {
            logger.error("Error searching for similar documents by type: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    public String buildContext(List<ExperienceKnowledgeBaseDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return "";
        }
        
        StringBuilder context = new StringBuilder();
        
        for (int i = 0; i < documents.size(); i++) {
            ExperienceKnowledgeBaseDocument doc = documents.get(i);
            
            context.append("Source ").append(i + 1).append(" (").append(doc.getDocumentType()).append("):\\n");
            context.append("Title: ").append(doc.getTitle()).append("\\n");
            
            // Truncate content if too long
            String content = doc.getContentText();
            if (content.length() > 1000) {
                content = content.substring(0, 1000) + "...";
            }
            context.append(content).append("\\n\\n");
        }
        
        return context.toString();
    }
    
    public Long getKnowledgeBaseStats() {
        try {
            return experienceKnowledgeBaseRepository.countTotalDocuments();
        } catch (Exception e) {
            logger.error("Error getting knowledge base stats: {}", e.getMessage());
            return 0L;
        }
    }
    
    public Long getDocumentCountByType(String documentType) {
        try {
            return experienceKnowledgeBaseRepository.countByDocumentType(documentType);
        } catch (Exception e) {
            logger.error("Error getting document count by type: {}", e.getMessage());
            return 0L;
        }
    }
    
    private String formatEmbeddingForPostgres(List<Double> embedding) {
        // Convert List<Double> to PostgreSQL vector format: [0.1,0.2,0.3,...]
        String vectorString = embedding.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        
        return "[" + vectorString + "]";
    }
}