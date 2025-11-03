package com.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "experience_knowledge_base")
public class ExperienceKnowledgeBaseDocument {
    
    @Id
    @Column(name = "document_id")
    private String documentId;
    
    @NotNull
    @Column(name = "document_type")
    private String documentType;
    
    @Column(name = "title", length = 500)
    private String title;
    
    @NotNull
    @Column(name = "content_text", columnDefinition = "TEXT")
    private String contentText;
    
    @Column(name = "embedding", columnDefinition = "vector(1536)")
    private String embedding; // Store as string, convert when needed
    
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
    
    @Column(name = "relevance_score")
    private Double relevanceScore;
    
    @Column(name = "source_experience_id")
    private Long sourceExperienceId;
    
    @Column(name = "source_article_id")
    private Long sourceArticleId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public ExperienceKnowledgeBaseDocument() {}
    
    // Getters and Setters
    public String getDocumentId() {
        return documentId;
    }
    
    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }
    
    public String getDocumentType() {
        return documentType;
    }
    
    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContentText() {
        return contentText;
    }
    
    public void setContentText(String contentText) {
        this.contentText = contentText;
    }
    
    public String getEmbedding() {
        return embedding;
    }
    
    public void setEmbedding(String embedding) {
        this.embedding = embedding;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public Double getRelevanceScore() {
        return relevanceScore;
    }
    
    public void setRelevanceScore(Double relevanceScore) {
        this.relevanceScore = relevanceScore;
    }
    
    public Long getSourceExperienceId() {
        return sourceExperienceId;
    }
    
    public void setSourceExperienceId(Long sourceExperienceId) {
        this.sourceExperienceId = sourceExperienceId;
    }
    
    public Long getSourceArticleId() {
        return sourceArticleId;
    }
    
    public void setSourceArticleId(Long sourceArticleId) {
        this.sourceArticleId = sourceArticleId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}