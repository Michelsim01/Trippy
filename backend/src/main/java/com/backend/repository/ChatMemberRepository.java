package com.backend.repository;

import com.backend.entity.ChatMember;
import com.backend.entity.PersonalChat;
import com.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    Optional<ChatMember> findByPersonalChatAndUser(PersonalChat personalChat, User user);
}
