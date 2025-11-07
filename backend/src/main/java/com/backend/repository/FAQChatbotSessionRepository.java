package com.backend.repository;

import com.backend.entity.FAQChatbotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FAQChatbotSessionRepository extends JpaRepository<FAQChatbotSession, Long> {
    
    Optional<FAQChatbotSession> findBySessionId(String sessionId);
    
    List<FAQChatbotSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
    
    @Query("SELECT cs FROM FAQChatbotSession cs WHERE cs.userId = :userId ORDER BY cs.updatedAt DESC")
    List<FAQChatbotSession> findRecentSessionsByUserId(@Param("userId") Long userId);
    
    boolean existsBySessionId(String sessionId);
    
    void deleteBySessionId(String sessionId);
}

