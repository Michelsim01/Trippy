package com.backend.repository;

import com.backend.entity.UserAnalyticsProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAnalyticsProfileRepository extends JpaRepository<UserAnalyticsProfile, Long> {

    /**
     * Find user analytics profile by user ID
     * @param userId The user ID
     * @return Optional containing the user analytics profile if found
     */
    Optional<UserAnalyticsProfile> findByUserId(Long userId);

    /**
     * Check if a user analytics profile exists for the given user ID
     * @param userId The user ID
     * @return true if profile exists, false otherwise
     */
    boolean existsByUserId(Long userId);
}
