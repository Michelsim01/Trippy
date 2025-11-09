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
    
    /**
     * Find similar FAQs using PostgreSQL vector similarity search
     * Uses cosine distance operator (<=>) for semantic similarity matching
     * @param queryEmbedding The query embedding as PostgreSQL vector string format: [0.1,0.2,0.3,...]
     * @param threshold Maximum cosine distance (lower = more similar, typically 0.3-0.5)
     * @param limit Maximum number of results to return
     * @return List of similar FAQs ordered by similarity (most similar first)
     */
    @Query(value = """
        SELECT * FROM faq_knowledge_base 
        WHERE embedding_vector IS NOT NULL
          AND embedding_vector <=> CAST(:queryEmbedding AS vector) < :threshold
        ORDER BY embedding_vector <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<FAQKnowledgeBase> findSimilarDocumentsByVector(
        @Param("queryEmbedding") String queryEmbedding,
        @Param("threshold") Double threshold,
        @Param("limit") Integer limit
    );
    
    /**
     * Get similarity score (cosine distance) for a specific FAQ
     * @param knowledgeId The knowledge base ID
     * @param queryEmbedding The query embedding as PostgreSQL vector string format: [0.1,0.2,0.3,...]
     * @return The cosine distance (lower = more similar)
     */
    @Query(value = """
        SELECT (embedding_vector <=> CAST(:queryEmbedding AS vector)) AS similarity_score
        FROM faq_knowledge_base
        WHERE knowledge_id = :knowledgeId
          AND embedding_vector IS NOT NULL
        """, nativeQuery = true)
    Double getSimilarityScore(@Param("knowledgeId") Long knowledgeId, @Param("queryEmbedding") String queryEmbedding);
}

