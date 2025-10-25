package com.backend.repository;

import com.backend.entity.PersonalChat;
import com.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalChatRepository extends JpaRepository<PersonalChat, Long> {
    
    @Query("SELECT pc FROM PersonalChat pc " +
           "JOIN pc.chatMembers cm1 " +
           "JOIN pc.chatMembers cm2 " +
           "WHERE pc.experience.experienceId = :experienceId " +
           "AND cm1.user.id = :touristId " +
           "AND cm2.user.id = :guideId " +
           "AND cm1.user.id != cm2.user.id")
    Optional<PersonalChat> findByExperienceAndTouristAndGuide(
        @Param("experienceId") Long experienceId,
        @Param("touristId") Long touristId,
        @Param("guideId") Long guideId
    );
    
    @Query("SELECT pc FROM PersonalChat pc " +
           "JOIN pc.chatMembers cm " +
           "WHERE cm.user.id = :userId " +
           "AND (pc.isTripChat = false OR pc.isTripChat IS NULL) " +
           "ORDER BY pc.createdAt DESC")
    List<PersonalChat> findChatsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT m FROM Message m WHERE m.personalChat.personalChatId = :chatId ORDER BY m.createdAt DESC")
    List<Message> findLastMessageByChatId(@Param("chatId") Long chatId);
    
    @Query("SELECT m FROM Message m WHERE m.personalChat.personalChatId IN :chatIds AND m.messageId IN " +
           "(SELECT MAX(m2.messageId) FROM Message m2 WHERE m2.personalChat.personalChatId = m.personalChat.personalChatId)")
    List<Message> findLastMessagesForChats(@Param("chatIds") List<Long> chatIds);
    
    @Query("SELECT pc FROM PersonalChat pc " +
           "LEFT JOIN FETCH pc.experience " +
           "LEFT JOIN FETCH pc.chatMembers cm " +
           "LEFT JOIN FETCH cm.user " +
           "WHERE pc.personalChatId = :chatId")
    Optional<PersonalChat> findByIdWithExperienceAndMembers(@Param("chatId") Long chatId);

    @Query("SELECT DISTINCT pc FROM PersonalChat pc " +
           "JOIN ChatMember cm ON cm.personalChat.personalChatId = pc.personalChatId " +
           "LEFT JOIN FETCH pc.tripCohort cohort " +
           "LEFT JOIN FETCH cohort.experienceSchedule schedule " +
           "LEFT JOIN FETCH schedule.experience exp " +
           "WHERE cm.user.id = :userId " +
           "AND pc.isTripChat = true")
    List<PersonalChat> findTripChatsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT pc FROM PersonalChat pc " +
           "LEFT JOIN FETCH pc.chatMembers members " +
           "LEFT JOIN FETCH members.user " +
           "WHERE pc.personalChatId IN :chatIds")
    List<PersonalChat> findByIdsWithMembers(@Param("chatIds") List<Long> chatIds);

    @Query("SELECT COUNT(pc) FROM PersonalChat pc " +
           "WHERE pc.experience.experienceId = :experienceId " +
           "AND (pc.isTripChat = false OR pc.isTripChat IS NULL)")
    long countByExperienceId(@Param("experienceId") Long experienceId);
}
