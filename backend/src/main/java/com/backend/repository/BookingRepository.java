package com.backend.repository;

import com.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTraveler_Id(Long userId);

    // Find bookings by traveler (user as participant)
    List<Booking> findByTraveler_IdOrderByExperienceSchedule_StartDateTimeAsc(Long travelerId);

    // Find bookings for experiences guided by user (user as guide)
    @Query("SELECT b FROM Booking b WHERE b.experienceSchedule.experience.guide.id = :guideId ORDER BY b.experienceSchedule.startDateTime ASC")
    List<Booking> findByGuideIdOrderByScheduleStartDateTimeAsc(@Param("guideId") Long guideId);

    // Find bookings by traveler within date range
    @Query("SELECT b FROM Booking b WHERE b.traveler.id = :travelerId AND b.experienceSchedule.startDateTime BETWEEN :startDate AND :endDate ORDER BY b.experienceSchedule.startDateTime ASC")
    List<Booking> findByTravelerIdAndDateRangeOrderByScheduleStartDateTimeAsc(
            @Param("travelerId") Long travelerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Find bookings for experiences guided by user within date range
    @Query("SELECT b FROM Booking b WHERE b.experienceSchedule.experience.guide.id = :guideId AND b.experienceSchedule.startDateTime BETWEEN :startDate AND :endDate ORDER BY b.experienceSchedule.startDateTime ASC")
    List<Booking> findByGuideIdAndDateRangeOrderByScheduleStartDateTimeAsc(
            @Param("guideId") Long guideId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
