package com.backend.service;

import com.backend.entity.ArticleComment;
import com.backend.entity.TravelArticle;
import com.backend.entity.User;
import com.backend.repository.ArticleCommentRepository;
import com.backend.repository.TravelArticleRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ArticleCommentService {

    @Autowired
    private ArticleCommentRepository commentRepository;

    @Autowired
    private TravelArticleRepository articleRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all comments for a specific article
     */
    public List<ArticleComment> getCommentsByArticleId(Long articleId) {
        return commentRepository.findByArticleIdOrderByCreatedAtAsc(articleId);
    }

    /**
     * Create a new comment for an article
     */
    public ArticleComment createComment(Long articleId, Long userId, String content) {
        // Validate article exists
        Optional<TravelArticle> articleOpt = articleRepository.findById(articleId);
        if (articleOpt.isEmpty()) {
            throw new RuntimeException("Article not found with id: " + articleId);
        }

        // Validate user exists
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        TravelArticle article = articleOpt.get();
        User user = userOpt.get();

        // Create new comment
        ArticleComment comment = new ArticleComment();
        comment.setTravelArticle(article);
        comment.setUser(user);
        comment.setContent(content);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        // Save comment
        ArticleComment savedComment = commentRepository.save(comment);

        // Update article comments count
        updateArticleCommentsCount(article);

        return savedComment;
    }

    /**
     * Update an existing comment
     */
    public ArticleComment updateComment(Long commentId, Long userId, String newContent) {
        Optional<ArticleComment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + commentId);
        }

        ArticleComment comment = commentOpt.get();

        // Check if user owns the comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("User not authorized to edit this comment");
        }

        // Update comment
        comment.setContent(newContent);
        comment.setUpdatedAt(LocalDateTime.now());

        return commentRepository.save(comment);
    }

    /**
     * Delete a comment
     */
    public void deleteComment(Long commentId, Long userId) {
        Optional<ArticleComment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + commentId);
        }

        ArticleComment comment = commentOpt.get();

        // Check if user owns the comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("User not authorized to delete this comment");
        }

        TravelArticle article = comment.getTravelArticle();

        // Delete comment
        commentRepository.delete(comment);

        // Update article comments count
        updateArticleCommentsCount(article);
    }

    /**
     * Like or unlike a comment
     */
    public ArticleComment toggleCommentLike(Long commentId, Long userId) {
        Optional<ArticleComment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + commentId);
        }

        ArticleComment comment = commentOpt.get();

        // For now, we'll just increment/decrement the likes count
        // In a full implementation, you'd have a separate CommentLike entity
        // to track which users liked which comments

        // Simple toggle - if user has liked before, unlike; otherwise like
        // This is a simplified implementation
        Integer currentLikes = comment.getLikesCount();
        if (currentLikes == null) {
            currentLikes = 0;
        }

        // For this simplified version, we'll just increment
        // In reality, you'd check if user already liked and toggle accordingly
        comment.setLikesCount(currentLikes + 1);

        return commentRepository.save(comment);
    }

    /**
     * Get comment by ID
     */
    public Optional<ArticleComment> getCommentById(Long commentId) {
        return commentRepository.findById(commentId);
    }

    /**
     * Update the comments count for an article
     */
    private void updateArticleCommentsCount(TravelArticle article) {
        long commentCount = commentRepository.countByTravelArticle(article);
        article.setCommentsCount((int) commentCount);
        articleRepository.save(article);
    }
}