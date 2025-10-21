package com.backend.repository;

import com.backend.entity.ArticleLike;
import com.backend.entity.TravelArticle;
import com.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArticleLikeRepository extends JpaRepository<ArticleLike, Long> {

    /**
     * Find a like by article and user (to check if user already liked the article)
     */
    Optional<ArticleLike> findByTravelArticleAndUser(TravelArticle travelArticle, User user);

    /**
     * Count total likes for an article
     */
    long countByTravelArticle(TravelArticle travelArticle);

    /**
     * Count total likes for an article by ID
     */
    @Query("SELECT COUNT(al) FROM ArticleLike al WHERE al.travelArticle.articleId = :articleId")
    long countByArticleId(@Param("articleId") Long articleId);

    /**
     * Check if user has liked a specific article
     */
    @Query("SELECT COUNT(al) > 0 FROM ArticleLike al WHERE al.travelArticle.articleId = :articleId AND al.user.id = :userId")
    boolean existsByArticleIdAndUserId(@Param("articleId") Long articleId, @Param("userId") Long userId);

    /**
     * Delete like by article and user
     */
    void deleteByTravelArticleAndUser(TravelArticle travelArticle, User user);
}