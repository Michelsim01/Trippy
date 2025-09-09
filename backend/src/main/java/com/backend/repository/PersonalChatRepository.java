package com.backend.repository;

import com.backend.entity.PersonalChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonalChatRepository extends JpaRepository<PersonalChat, Long> {
}
