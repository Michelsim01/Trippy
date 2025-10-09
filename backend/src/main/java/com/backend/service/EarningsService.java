package com.backend.service;

import com.backend.dto.ExperienceEarningsDTO;
import com.backend.dto.GuideEarningsDTO;
import com.backend.dto.ScheduleEarningsDTO;
import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.ExperienceSchedule;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EarningsService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    public GuideEarningsDTO getGuideEarnings(Long guideId) {
        try {
            System.out.println("DEBUG: Fetching earnings for guide ID: " + guideId);

            List<Booking> allBookings = bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId);
            System.out.println("DEBUG: Found " + allBookings.size() + " bookings");

            // Handle null amounts gracefully
            BigDecimal pendingEarnings = allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                    .map(booking -> booking.getBaseAmount() != null ? booking.getBaseAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal paidOutEarnings = allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                    .map(booking -> booking.getBaseAmount() != null ? booking.getBaseAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalEarnings = pendingEarnings.add(paidOutEarnings);

            Integer pendingBookings = (int) allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                    .count();

            Integer completedBookings = (int) allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                    .count();

            Integer totalBookings = pendingBookings + completedBookings;

            System.out.println("DEBUG: Calculated earnings - Total: " + totalEarnings + ", Pending: " + pendingEarnings + ", Paid: " + paidOutEarnings);

            return new GuideEarningsDTO(totalEarnings, pendingEarnings, paidOutEarnings,
                    totalBookings, pendingBookings, completedBookings);
        } catch (Exception e) {
            System.err.println("ERROR in getGuideEarnings: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch guide earnings: " + e.getMessage(), e);
        }
    }

    public ExperienceEarningsDTO getExperienceEarnings(Long experienceId, Long guideId) {
        // Get all schedules for this experience
        List<ExperienceSchedule> schedules = experienceScheduleRepository.findByExperience_ExperienceIdOrderByStartDateTimeAsc(experienceId);

        // Verify that the guide owns this experience
        if (schedules.isEmpty() || !schedules.get(0).getExperience().getGuide().getId().equals(guideId)) {
            throw new RuntimeException("Experience not found or access denied");
        }

        String experienceTitle = schedules.get(0).getExperience().getTitle();

        // Get all bookings for this experience
        List<Booking> experienceBookings = schedules.stream()
                .flatMap(schedule -> schedule.getBookings().stream())
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.COMPLETED)
                .collect(Collectors.toList());

        // Calculate experience-level totals
        BigDecimal pendingEarnings = experienceBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paidOutEarnings = experienceBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .map(Booking::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEarnings = pendingEarnings.add(paidOutEarnings);

        // Group bookings by schedule and create ScheduleEarningsDTO
        Map<Long, List<Booking>> bookingsBySchedule = experienceBookings.stream()
                .collect(Collectors.groupingBy(booking -> booking.getExperienceSchedule().getScheduleId()));

        List<ScheduleEarningsDTO> scheduleEarnings = schedules.stream()
                .map(schedule -> {
                    List<Booking> scheduleBookings = bookingsBySchedule.getOrDefault(schedule.getScheduleId(), List.of());

                    Integer bookingCount = scheduleBookings.size();
                    Integer totalGuests = scheduleBookings.stream()
                            .mapToInt(Booking::getNumberOfParticipants)
                            .sum();

                    BigDecimal potentialEarnings = scheduleBookings.stream()
                            .map(Booking::getBaseAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // Determine schedule status - if all bookings are COMPLETED, then COMPLETED, otherwise CONFIRMED
                    String status = "CONFIRMED";
                    if (!scheduleBookings.isEmpty() && scheduleBookings.stream().allMatch(booking -> booking.getStatus() == BookingStatus.COMPLETED)) {
                        status = "COMPLETED";
                    }

                    return new ScheduleEarningsDTO(
                            schedule.getScheduleId(),
                            schedule.getStartDateTime(),
                            schedule.getEndDateTime(),
                            bookingCount,
                            totalGuests,
                            potentialEarnings,
                            status
                    );
                })
                .filter(scheduleEarning -> scheduleEarning.getBookingCount() > 0) // Only include schedules with bookings
                .collect(Collectors.toList());

        return new ExperienceEarningsDTO(experienceId, experienceTitle, totalEarnings, pendingEarnings, paidOutEarnings, scheduleEarnings);
    }
}