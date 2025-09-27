package com.backend.repository;

import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

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
}
