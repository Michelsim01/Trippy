package com.backend.repository;

import com.backend.entity.TravelArticle;
import com.backend.entity.ArticleStatusEnum;
import com.backend.entity.ArticleCategoryEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TravelArticleRepository extends JpaRepository<TravelArticle, Long> {

    List<TravelArticle> findByStatus(ArticleStatusEnum status);

    @Query("SELECT t FROM TravelArticle t WHERE t.author.id = :authorId AND t.status = :status")
    List<TravelArticle> findByAuthorIdAndStatus(@Param("authorId") Long authorId, @Param("status") ArticleStatusEnum status);

    @Query("SELECT t FROM TravelArticle t WHERE t.author.id = :authorId")
    List<TravelArticle> findByAuthorId(@Param("authorId") Long authorId);

    List<TravelArticle> findByStatusAndCategory(ArticleStatusEnum status, ArticleCategoryEnum category);

    List<TravelArticle> findByStatusOrderByCreatedAtDesc(ArticleStatusEnum status);

    @Query("SELECT t FROM TravelArticle t WHERE t.author.id = :authorId AND t.status = :status ORDER BY t.createdAt DESC")
    List<TravelArticle> findByAuthorIdAndStatusOrderByCreatedAtDesc(@Param("authorId") Long authorId, @Param("status") ArticleStatusEnum status);

    @Query("SELECT DISTINCT t FROM TravelArticle t " +
           "LEFT JOIN t.author a " +
           "WHERE t.status = :status " +
           "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(t.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(CONCAT(a.firstName, ' ', a.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<TravelArticle> searchPublishedArticles(@Param("status") ArticleStatusEnum status, @Param("searchTerm") String searchTerm);

    @Query("SELECT DISTINCT t FROM TravelArticle t " +
           "LEFT JOIN t.author a " +
           "WHERE t.status = :status AND t.category = :category " +
           "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(t.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(CONCAT(a.firstName, ' ', a.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<TravelArticle> searchPublishedArticlesByCategory(@Param("status") ArticleStatusEnum status,
                                                           @Param("category") ArticleCategoryEnum category,
                                                           @Param("searchTerm") String searchTerm);
}
