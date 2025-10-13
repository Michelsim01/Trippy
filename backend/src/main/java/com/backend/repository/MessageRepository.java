package com.backend.repository;

import com.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.personalChat.personalChatId = :chatId ORDER BY m.createdAt ASC")
    List<Message> findByPersonalChatIdOrderByCreatedAt(@Param("chatId") Long chatId);

    @Query("SELECT m FROM Message m WHERE m.personalChat.personalChatId = :chatId ORDER BY m.createdAt DESC")
    List<Message> findByPersonalChatIdOrderByCreatedAtDesc(@Param("chatId") Long chatId);
}
