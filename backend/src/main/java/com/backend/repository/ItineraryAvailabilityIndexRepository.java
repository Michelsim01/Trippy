package com.backend.repository;

import com.backend.entity.ItineraryAvailabilityIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryAvailabilityIndexRepository extends JpaRepository<ItineraryAvailabilityIndex, Long> {

    /**
     * Find availability for a specific experience on a specific date
     */
    @Query("SELECT ai FROM ItineraryAvailabilityIndex ai " +
           "WHERE ai.experienceId = :experienceId AND ai.scheduleDate = :date")
    Optional<ItineraryAvailabilityIndex> findByExperienceAndDate(
        @Param("experienceId") Long experienceId,
        @Param("date") LocalDate date
    );

    /**
     * Find all availability for an experience within a date range
     */
    @Query("SELECT ai FROM ItineraryAvailabilityIndex ai " +
           "WHERE ai.experienceId = :experienceId " +
           "AND ai.scheduleDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ai.scheduleDate ASC")
    List<ItineraryAvailabilityIndex> findByExperienceAndDateRange(
        @Param("experienceId") Long experienceId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find availability for multiple experiences within a date range
     */
    @Query("SELECT ai FROM ItineraryAvailabilityIndex ai " +
           "WHERE ai.experienceId IN :experienceIds " +
           "AND ai.scheduleDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ai.experienceId, ai.scheduleDate ASC")
    List<ItineraryAvailabilityIndex> findByExperiencesAndDateRange(
        @Param("experienceIds") List<Long> experienceIds,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find experiences with available spots on a specific date
     */
    @Query("SELECT ai FROM ItineraryAvailabilityIndex ai " +
           "WHERE ai.scheduleDate = :date " +
           "AND ai.experienceId IN :experienceIds " +
           "AND ai.availableSchedulesCount > 0 " +
           "ORDER BY ai.bookingPressure ASC")
    List<ItineraryAvailabilityIndex> findAvailableExperiencesOnDate(
        @Param("date") LocalDate date,
        @Param("experienceIds") List<Long> experienceIds
    );

    /**
     * Find experiences with high availability (low booking pressure)
     */
    @Query("SELECT ai FROM ItineraryAvailabilityIndex ai " +
           "WHERE ai.experienceId IN :experienceIds " +
           "AND ai.scheduleDate BETWEEN :startDate AND :endDate " +
           "AND ai.bookingPressure < :maxPressure " +
           "AND ai.availableSchedulesCount > 0 " +
           "ORDER BY ai.bookingPressure ASC, ai.scheduleDate ASC")
    List<ItineraryAvailabilityIndex> findLowPressureAvailability(
        @Param("experienceIds") List<Long> experienceIds,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("maxPressure") Double maxPressure
    );

    /**
     * Count available dates for an experience in a date range
     */
    @Query("SELECT COUNT(ai) FROM ItineraryAvailabilityIndex ai " +
           "WHERE ai.experienceId = :experienceId " +
           "AND ai.scheduleDate BETWEEN :startDate AND :endDate " +
           "AND ai.availableSchedulesCount > 0")
    Long countAvailableDates(
        @Param("experienceId") Long experienceId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
