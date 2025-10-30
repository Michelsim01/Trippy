package com.backend.repository;

import com.backend.entity.FAQKnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for FAQKnowledgeBase entity operations.
 */
@Repository
public interface FAQKnowledgeBaseRepository extends JpaRepository<FAQKnowledgeBase, Long> {
    
    /**
     * Find knowledge base entries by source type
     */
    List<FAQKnowledgeBase> findBySourceType(String sourceType);
    
    /**
     * Find knowledge base entries by category
     */
    List<FAQKnowledgeBase> findByCategory(String category);
    
    /**
     * Find knowledge base entries by source type and source ID
     */
    FAQKnowledgeBase findBySourceTypeAndSourceId(String sourceType, Long sourceId);
    
    /**
     * Find all knowledge base entries ordered by last updated
     */
    @Query("SELECT kb FROM FAQKnowledgeBase kb ORDER BY kb.lastUpdated DESC")
    List<FAQKnowledgeBase> findAllOrderByLastUpdatedDesc();
    
    /**
     * Search knowledge base by content keyword
     */
    @Query("SELECT kb FROM FAQKnowledgeBase kb WHERE kb.content ILIKE %:keyword% ORDER BY kb.lastUpdated DESC")
    List<FAQKnowledgeBase> searchByContent(@Param("keyword") String keyword);
    
    /**
     * Find knowledge base entries by category ordered by last updated
     */
    @Query("SELECT kb FROM FAQKnowledgeBase kb WHERE kb.category = :category ORDER BY kb.lastUpdated DESC")
    List<FAQKnowledgeBase> findByCategoryOrderByLastUpdatedDesc(@Param("category") String category);
}

