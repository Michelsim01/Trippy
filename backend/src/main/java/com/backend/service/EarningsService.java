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

            // Calculate pending deductions from guide cancellation fees
            BigDecimal pendingDeductions = bookingRepository.calculatePendingCancellationFees(guideId);

            Integer pendingBookings = (int) allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                    .count();

            Integer completedBookings = (int) allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                    .count();

            Integer cancelledBookings = (int) allBookings.stream()
                    .filter(booking -> booking.getStatus() == BookingStatus.CANCELLED_BY_GUIDE)
                    .count();

            Integer totalBookings = pendingBookings + completedBookings;

            System.out.println("DEBUG: Calculated earnings - Total: " + totalEarnings + ", Pending: " + pendingEarnings + ", Paid: " + paidOutEarnings + ", Deductions: " + pendingDeductions);

            return new GuideEarningsDTO(totalEarnings, pendingEarnings, paidOutEarnings, pendingDeductions,
                    totalBookings, pendingBookings, completedBookings, cancelledBookings);
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

        // Get ALL bookings for this experience (including cancelled ones for fee calculation)
        List<Booking> allExperienceBookings = schedules.stream()
                .flatMap(schedule -> schedule.getBookings().stream())
                .collect(Collectors.toList());

        // Filter only active bookings for earnings calculations
        List<Booking> experienceBookings = allExperienceBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.COMPLETED)
                .collect(Collectors.toList());

        // Calculate experience-level totals from active bookings only
        BigDecimal pendingEarnings = experienceBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paidOutEarnings = experienceBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .map(Booking::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEarnings = pendingEarnings.add(paidOutEarnings);

        // Calculate pending deductions from ALL bookings (including cancelled ones)
        // This ensures cancellation fees are tracked even after schedules are cancelled
        BigDecimal pendingDeductions = allExperienceBookings.stream()
                .filter(booking -> booking.getGuideCancellationFee() != null &&
                                 booking.getGuideCancellationFee().compareTo(BigDecimal.ZERO) > 0)
                .map(Booking::getGuideCancellationFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group ALL bookings (including cancelled ones) by schedule for complete view
        Map<Long, List<Booking>> allBookingsBySchedule = allExperienceBookings.stream()
                .collect(Collectors.groupingBy(booking -> booking.getExperienceSchedule().getScheduleId()));

        // Group active bookings by schedule for earnings calculations
        Map<Long, List<Booking>> bookingsBySchedule = experienceBookings.stream()
                .collect(Collectors.groupingBy(booking -> booking.getExperienceSchedule().getScheduleId()));

        List<ScheduleEarningsDTO> scheduleEarnings = schedules.stream()
                .map(schedule -> {
                    List<Booking> scheduleBookings = bookingsBySchedule.getOrDefault(schedule.getScheduleId(), List.of());
                    List<Booking> allScheduleBookings = allBookingsBySchedule.getOrDefault(schedule.getScheduleId(), List.of());

                    Integer bookingCount = scheduleBookings.size();
                    Integer totalGuests = scheduleBookings.stream()
                            .mapToInt(Booking::getNumberOfParticipants)
                            .sum();

                    BigDecimal potentialEarnings = scheduleBookings.stream()
                            .map(Booking::getBaseAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // Determine schedule status - check for cancelled schedules
                    String status = "CONFIRMED";
                    boolean hasCancelledBookings = allScheduleBookings.stream()
                            .anyMatch(booking -> booking.getStatus() == BookingStatus.CANCELLED_BY_GUIDE);

                    if (hasCancelledBookings && scheduleBookings.isEmpty()) {
                        status = "CANCELLED";
                    } else if (!scheduleBookings.isEmpty() && scheduleBookings.stream().allMatch(booking -> booking.getStatus() == BookingStatus.COMPLETED)) {
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
                .filter(scheduleEarning -> scheduleEarning.getBookingCount() > 0 || "CANCELLED".equals(scheduleEarning.getStatus())) // Include schedules with bookings OR cancelled schedules
                .collect(Collectors.toList());

        return new ExperienceEarningsDTO(experienceId, experienceTitle, totalEarnings, pendingEarnings, paidOutEarnings, pendingDeductions, scheduleEarnings);
    }
}