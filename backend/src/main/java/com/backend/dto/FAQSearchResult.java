package com.backend.dto;

import com.backend.entity.FAQKnowledgeBase;

/**
 * DTO for FAQ search results with similarity score
 */
public class FAQSearchResult {
    private FAQKnowledgeBase faq;
    private Double similarityScore; // Cosine distance (lower = more similar)
    private Double confidence; // 1 - similarityScore (higher = more confident)
    
    public FAQSearchResult(FAQKnowledgeBase faq, Double similarityScore) {
        this.faq = faq;
        this.similarityScore = similarityScore;
        // Convert cosine distance to confidence (0-1 scale)
        // Lower distance = higher confidence
        this.confidence = similarityScore != null ? Math.max(0.0, Math.min(1.0, 1.0 - similarityScore)) : 0.0;
    }
    
    public FAQKnowledgeBase getFaq() {
        return faq;
    }
    
    public void setFaq(FAQKnowledgeBase faq) {
        this.faq = faq;
    }
    
    public Double getSimilarityScore() {
        return similarityScore;
    }
    
    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
        this.confidence = similarityScore != null ? Math.max(0.0, Math.min(1.0, 1.0 - similarityScore)) : 0.0;
    }
    
    public Double getConfidence() {
        return confidence;
    }
}

