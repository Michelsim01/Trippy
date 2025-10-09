package com.backend.repository;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    
    @Query("SELECT DISTINCT e.country FROM Experience e WHERE LOWER(e.country) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findLocationSuggestions(@Param("query") String query);
    
    @Query("SELECT e FROM Experience e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.location) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.country) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY " +
           "CASE WHEN LOWER(e.title) LIKE LOWER(CONCAT(:query, '%')) THEN 1 " +
           "     WHEN LOWER(e.country) LIKE LOWER(CONCAT(:query, '%')) THEN 2 " +
           "     WHEN LOWER(e.location) LIKE LOWER(CONCAT(:query, '%')) THEN 3 " +
           "     ELSE 4 END")
    List<Experience> findExperienceSuggestions(@Param("query") String query);
    
    // Find experiences by guide ID
    List<Experience> findByGuide_Id(Long guideId);
    
    // Count experiences by status for admin dashboard
    @Query("SELECT COUNT(e) FROM Experience e WHERE e.status = :status")
    Long countByStatus(@Param("status") ExperienceStatus status);
    
    // Get category counts for chart data
    @Query("SELECT e.category as category, COUNT(e) as count FROM Experience e WHERE e.status = 'ACTIVE' GROUP BY e.category ORDER BY COUNT(e) DESC")
    List<Object[]> findCategoryCounts();
    
    // Get top performing experiences by booking count and revenue
    @Query("SELECT e.experienceId, e.title, e.category, " +
           "COALESCE(COUNT(b.bookingId), 0) as bookingCount, " +
           "COALESCE(SUM(b.serviceFee), 0) as totalRevenue, " +
           "COALESCE(AVG(r.rating), 0) as averageRating " +
           "FROM Experience e " +
           "LEFT JOIN ExperienceSchedule es ON e.experienceId = es.experience.experienceId " +
           "LEFT JOIN Booking b ON es.scheduleId = b.experienceSchedule.scheduleId " +
           "LEFT JOIN Review r ON b.bookingId = r.booking.bookingId " +
           "WHERE e.status = 'ACTIVE' " +
           "GROUP BY e.experienceId, e.title, e.category " +
           "ORDER BY bookingCount DESC, totalRevenue DESC " +
           "LIMIT 5")
    List<Object[]> findTopPerformingExperiences();
    
    // Get pending experiences awaiting approval
    @Query("SELECT e.experienceId, e.title, e.category, e.location, " +
           "CONCAT(u.firstName, ' ', u.lastName) as guideName, " +
           "e.createdAt as submittedAt " +
           "FROM Experience e " +
           "JOIN User u ON e.guide.id = u.id " +
           "WHERE e.status = 'PENDING' " +
           "ORDER BY e.createdAt ASC " +
           "LIMIT 5")
    List<Object[]> findPendingExperiences();
}
