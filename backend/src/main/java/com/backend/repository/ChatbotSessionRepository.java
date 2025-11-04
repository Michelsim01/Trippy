package com.backend.repository;

import com.backend.entity.ChatbotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatbotSessionRepository extends JpaRepository<ChatbotSession, Long> {
    
    Optional<ChatbotSession> findBySessionId(String sessionId);
    
    List<ChatbotSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
    
    @Query("SELECT cs FROM ChatbotSession cs WHERE cs.userId = :userId ORDER BY cs.updatedAt DESC")
    List<ChatbotSession> findRecentSessionsByUserId(@Param("userId") Long userId);
    
    boolean existsBySessionId(String sessionId);
    
    void deleteBySessionId(String sessionId);
}