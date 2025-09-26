package com.backend.repository;

import com.backend.entity.PersonalChat;
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
           "ORDER BY pc.createdAt DESC")
    List<PersonalChat> findChatsByUserId(@Param("userId") Long userId);
}
