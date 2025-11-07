package com.backend.repository;

import com.backend.entity.ExperienceKnowledgeBaseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperienceKnowledgeBaseRepository extends JpaRepository<ExperienceKnowledgeBaseDocument, String> {
    
    List<ExperienceKnowledgeBaseDocument> findByDocumentType(String documentType);
    
    @Query(value = """
        SELECT * FROM experience_knowledge_base 
        WHERE embedding <=> CAST(:queryEmbedding AS vector) < :threshold
        ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ExperienceKnowledgeBaseDocument> findSimilarDocuments(
        @Param("queryEmbedding") String queryEmbedding,
        @Param("threshold") Double threshold,
        @Param("limit") Integer limit
    );
    
    @Query(value = """
        SELECT * FROM experience_knowledge_base 
        WHERE document_type = :documentType 
        AND embedding <=> CAST(:queryEmbedding AS vector) < :threshold
        ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ExperienceKnowledgeBaseDocument> findSimilarDocumentsByType(
        @Param("queryEmbedding") String queryEmbedding,
        @Param("documentType") String documentType,
        @Param("threshold") Double threshold,
        @Param("limit") Integer limit
    );
    
    @Query("SELECT COUNT(kd) FROM ExperienceKnowledgeBaseDocument kd")
    Long countTotalDocuments();
    
    @Query("SELECT COUNT(kd) FROM ExperienceKnowledgeBaseDocument kd WHERE kd.documentType = :documentType")
    Long countByDocumentType(@Param("documentType") String documentType);

    @Query(value = """
        SELECT * FROM experience_knowledge_base
        WHERE embedding <=> CAST(:queryEmbedding AS vector) < :threshold
        AND (
            metadata->>'location' ILIKE CONCAT('%', :location, '%')
            OR metadata->>'country' ILIKE CONCAT('%', :location, '%')
        )
        ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ExperienceKnowledgeBaseDocument> findSimilarDocumentsByLocation(
        @Param("queryEmbedding") String queryEmbedding,
        @Param("location") String location,
        @Param("threshold") Double threshold,
        @Param("limit") Integer limit
    );
}