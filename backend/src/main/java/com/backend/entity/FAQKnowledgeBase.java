package com.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "faq_knowledge_base")
public class FAQKnowledgeBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "knowledge_id")
    private Long knowledgeId;
    
    @Column(name = "source_type", length = 50, nullable = false)
    private String sourceType; // 'faq', 'policy_doc', 'review_insight', 'blog', 'experience'
    
    @Column(name = "source_id")
    private Long sourceId; // References faq_id or other source IDs
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // The actual content/context
    
    @Column(name = "vectorized_content", columnDefinition = "TEXT")
    private String vectorizedContent; // TF-IDF/semantic representation
    
    @Column(length = 50)
    private String category;
    
    @Column(name = "keywords")
    private String keywords; // Comma-separated or JSON array
    
    @Column(columnDefinition = "JSONB")
    private String metadata; // Additional structured data as JSON
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;
    
    // Constructors
    public FAQKnowledgeBase() {}
    
    public FAQKnowledgeBase(String sourceType, Long sourceId, String content) {
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.content = content;
    }
    
    // Getters and Setters
    public Long getKnowledgeId() {
        return knowledgeId;
    }
    
    public void setKnowledgeId(Long knowledgeId) {
        this.knowledgeId = knowledgeId;
    }
    
    public String getSourceType() {
        return sourceType;
    }
    
    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }
    
    public Long getSourceId() {
        return sourceId;
    }
    
    public void setSourceId(Long sourceId) {
        this.sourceId = sourceId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getVectorizedContent() {
        return vectorizedContent;
    }
    
    public void setVectorizedContent(String vectorizedContent) {
        this.vectorizedContent = vectorizedContent;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getKeywords() {
        return keywords;
    }
    
    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}

