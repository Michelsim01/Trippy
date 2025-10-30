package com.backend.repository;

import com.backend.entity.FAQ;
import com.backend.entity.FAQCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for FAQ entity operations.
 */
@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {
    
    /**
     * Find FAQs by category
     */
    List<FAQ> findByCategory(FAQCategory category);
    
    /**
     * Find FAQs ordered by priority (descending)
     */
    @Query("SELECT f FROM FAQ f ORDER BY f.priority DESC, f.helpfulCount DESC")
    List<FAQ> findAllOrderByPriorityDesc();
    
    /**
     * Find FAQs by category ordered by priority
     */
    @Query("SELECT f FROM FAQ f WHERE f.category = :category ORDER BY f.priority DESC, f.helpfulCount DESC")
    List<FAQ> findByCategoryOrderByPriorityDesc(@Param("category") FAQCategory category);
    
    /**
     * Find FAQs by keyword search in question
     */
    @Query("SELECT f FROM FAQ f WHERE f.question ILIKE %:keyword% ORDER BY f.priority DESC")
    List<FAQ> searchByQuestion(@Param("keyword") String keyword);
    
    /**
     * Find FAQs by keyword search in answer
     */
    @Query("SELECT f FROM FAQ f WHERE f.answer ILIKE %:keyword% ORDER BY f.priority DESC")
    List<FAQ> searchByAnswer(@Param("keyword") String keyword);
    
    /**
     * Get most viewed FAQs
     */
    @Query("SELECT f FROM FAQ f ORDER BY f.viewCount DESC")
    List<FAQ> findMostViewed(int limit);
    
    /**
     * Get most helpful FAQs
     */
    @Query("SELECT f FROM FAQ f ORDER BY f.helpfulCount DESC")
    List<FAQ> findMostHelpful(int limit);
}

