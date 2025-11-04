package com.backend.repository;

import com.backend.entity.FAQChatbotMessage;
import com.backend.entity.FAQChatbotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FAQChatbotMessageRepository extends JpaRepository<FAQChatbotMessage, Long> {
    
    List<FAQChatbotMessage> findByFaqChatbotSessionOrderByCreatedAtAsc(FAQChatbotSession faqChatbotSession);
    
    @Query("SELECT cm FROM FAQChatbotMessage cm WHERE cm.faqChatbotSession.sessionId = :sessionId ORDER BY cm.createdAt ASC")
    List<FAQChatbotMessage> findBySessionIdOrderByCreatedAtAsc(@Param("sessionId") String sessionId);
    
    @Query("SELECT cm FROM FAQChatbotMessage cm WHERE cm.faqChatbotSession.id = :sessionId ORDER BY cm.createdAt DESC")
    List<FAQChatbotMessage> findRecentMessagesBySessionId(@Param("sessionId") Long sessionId);
    
    void deleteByFaqChatbotSession(FAQChatbotSession faqChatbotSession);
}

