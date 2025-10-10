package com.backend.repository;

import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import java.util.Optional;

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

    // Check if an experience has any bookings
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.experienceSchedule.experience.experienceId = :experienceId")
    boolean existsByExperienceId(@Param("experienceId") Long experienceId);

    @Query("SELECT COUNT(b.numberOfParticipants) FROM Booking b WHERE b.experienceSchedule.scheduleId = :scheduleId AND b.status = :status")
    int countParticipantsByScheduleIdAndStatus(@Param("scheduleId") Long scheduleId,
            @Param("status") BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.contactEmail = :email ORDER BY b.bookingDate DESC")
    List<Booking> findByContactEmailOrderByBookingDateDesc(@Param("email") String email);

    @Query("SELECT b FROM Booking b WHERE b.experienceSchedule.scheduleId = :scheduleId AND b.status IN (:statuses)")
    List<Booking> findByScheduleIdAndStatusIn(@Param("scheduleId") Long scheduleId,
            @Param("statuses") List<BookingStatus> statuses);

    Optional<Booking> findByConfirmationCode(String confirmationCode);

    List<Booking> findByStatusIn(List<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b WHERE b.experienceSchedule.experience.guide.id = :guideId ORDER BY b.bookingDate DESC")
    List<Booking> findByGuideIdOrderByBookingDateDesc(@Param("guideId") Long guideId);

    // Calculate total revenue (service_fee) for bookings within date range
    @Query("SELECT COALESCE(SUM(b.serviceFee), 0) FROM Booking b WHERE b.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueByDateRange(@Param("startDate") LocalDateTime startDate, 
                                         @Param("endDate") LocalDateTime endDate);

    // Count bookings created within date range
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt BETWEEN :startDate AND :endDate")
    Long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                @Param("endDate") LocalDateTime endDate);

    // Count bookings by traveler ID
    Long countByTraveler_Id(Long travelerId);
    
    // Count bookings by experience ID through experience schedule
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.experienceSchedule.experience.experienceId = :experienceId")
    Long countByExperienceId(@Param("experienceId") Long experienceId);
}
