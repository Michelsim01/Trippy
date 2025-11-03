package com.backend.repository;

import com.backend.entity.ChatbotMessage;
import com.backend.entity.ChatbotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatbotMessageRepository extends JpaRepository<ChatbotMessage, Long> {
    
    List<ChatbotMessage> findByChatbotSessionOrderByCreatedAtAsc(ChatbotSession chatbotSession);
    
    @Query("SELECT cm FROM ChatbotMessage cm WHERE cm.chatbotSession.sessionId = :sessionId ORDER BY cm.createdAt ASC")
    List<ChatbotMessage> findBySessionIdOrderByCreatedAtAsc(@Param("sessionId") String sessionId);
    
    @Query("SELECT cm FROM ChatbotMessage cm WHERE cm.chatbotSession.id = :sessionId ORDER BY cm.createdAt DESC")
    List<ChatbotMessage> findRecentMessagesBySessionId(@Param("sessionId") Long sessionId);
    
    void deleteByChatbotSession(ChatbotSession chatbotSession);
}