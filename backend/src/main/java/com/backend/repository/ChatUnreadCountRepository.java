package com.backend.repository;

import com.backend.entity.ChatUnreadCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatUnreadCountRepository extends JpaRepository<ChatUnreadCount, Long> {
    
    @Query("SELECT cuc FROM ChatUnreadCount cuc WHERE cuc.personalChat.personalChatId = :chatId AND cuc.user.id = :userId")
    Optional<ChatUnreadCount> findByChatIdAndUserId(@Param("chatId") Long chatId, @Param("userId") Long userId);
    
    @Query("SELECT cuc FROM ChatUnreadCount cuc WHERE cuc.user.id = :userId")
    List<ChatUnreadCount> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT cuc FROM ChatUnreadCount cuc WHERE cuc.personalChat.personalChatId = :chatId")
    List<ChatUnreadCount> findByChatId(@Param("chatId") Long chatId);
}