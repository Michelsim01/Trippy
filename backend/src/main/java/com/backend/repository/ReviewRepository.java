package com.backend.repository;

import com.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Check if a review exists for a specific booking
    boolean existsByBooking_BookingId(Long bookingId);

    // Find reviews by experience
    List<Review> findByExperience_ExperienceId(Long experienceId);

    // Find reviews by reviewer
    List<Review> findByReviewer_Id(Long reviewerId);

    // Find review by booking (should be unique)
    Review findByBooking_BookingId(Long bookingId);

    // Find reviews by multiple experience IDs (for getting reviews received on user's experiences)
    List<Review> findByExperience_ExperienceIdIn(List<Long> experienceIds);
    
    // Count reviews by experience ID
    @Query("SELECT COUNT(r) FROM Review r WHERE r.experience.experienceId = :experienceId")
    Long countByExperienceId(@Param("experienceId") Long experienceId);
}
