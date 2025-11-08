package com.backend.repository;

import com.backend.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUser_Id(Long userId);
    Optional<WishlistItem> findByUser_IdAndExperience_ExperienceId(Long userId, Long experienceId);
    long countByExperience_ExperienceId(Long experienceId);
    List<WishlistItem> findByExperience_ExperienceId(Long experienceId);
}
