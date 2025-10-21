package com.backend.repository;

import com.backend.entity.ArticleComment;
import com.backend.entity.TravelArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleCommentRepository extends JpaRepository<ArticleComment, Long> {

    /**
     * Find all comments for a specific article, ordered by creation date
     */
    List<ArticleComment> findByTravelArticleOrderByCreatedAtAsc(TravelArticle travelArticle);

    /**
     * Find all comments for a specific article by ID, ordered by creation date
     */
    @Query("SELECT ac FROM ArticleComment ac WHERE ac.travelArticle.articleId = :articleId ORDER BY ac.createdAt ASC")
    List<ArticleComment> findByArticleIdOrderByCreatedAtAsc(@Param("articleId") Long articleId);

    /**
     * Find paginated comments for a specific article
     */
    Page<ArticleComment> findByTravelArticleOrderByCreatedAtDesc(TravelArticle travelArticle, Pageable pageable);

    /**
     * Count total comments for an article
     */
    long countByTravelArticle(TravelArticle travelArticle);

    /**
     * Count total comments for an article by ID
     */
    @Query("SELECT COUNT(ac) FROM ArticleComment ac WHERE ac.travelArticle.articleId = :articleId")
    long countByArticleId(@Param("articleId") Long articleId);

    /**
     * Find comments by user for a specific article
     */
    @Query("SELECT ac FROM ArticleComment ac WHERE ac.travelArticle.articleId = :articleId AND ac.user.id = :userId ORDER BY ac.createdAt ASC")
    List<ArticleComment> findByArticleIdAndUserId(@Param("articleId") Long articleId, @Param("userId") Long userId);
}
