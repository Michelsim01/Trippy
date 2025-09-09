package com.backend.repository;

import com.backend.entity.TripChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripChatRepository extends JpaRepository<TripChat, Long> {
}
