package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "travel_article")
public class TravelArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long articleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;
    private String slug;
    @ElementCollection
    private List<String> tags;
    @Enumerated(EnumType.STRING)
    private ArticleStatusEnum status;
    @Enumerated(EnumType.STRING)
    private ArticleCategoryEnum category;
    private Integer viewsCount;
    @ElementCollection
    private List<String> imagesUrl;
    @ElementCollection
    private List<String> videosUrl;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getArticleId() { return articleId; }
    public void setArticleId(Long articleId) { this.articleId = articleId; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public java.util.List<String> getTags() { return tags; }
    public void setTags(java.util.List<String> tags) { this.tags = tags; }
    public ArticleStatusEnum getStatus() { return status; }
    public void setStatus(ArticleStatusEnum status) { this.status = status; }
    public ArticleCategoryEnum getCategory() { return category; }
    public void setCategory(ArticleCategoryEnum category) { this.category = category; }
    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) { this.viewsCount = viewsCount; }
    public java.util.List<String> getImagesUrl() { return imagesUrl; }
    public void setImagesUrl(java.util.List<String> imagesUrl) { this.imagesUrl = imagesUrl; }
    public java.util.List<String> getVideosUrl() { return videosUrl; }
    public void setVideosUrl(java.util.List<String> videosUrl) { this.videosUrl = videosUrl; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
