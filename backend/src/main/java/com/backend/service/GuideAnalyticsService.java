package com.backend.service;

import com.backend.dto.GuideDashboardMetricsDTO;
import com.backend.dto.ProfitChartDataDTO;
import com.backend.dto.TopExperienceDTO;
import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.Experience;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GuideAnalyticsService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    /**
     * Get dashboard metrics for a guide
     * Includes: monthly bookings, cancellation rate, total experiences
     */
    public GuideDashboardMetricsDTO getDashboardMetrics(Long guideId) {
        // Get current and previous month date ranges
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        LocalDateTime currentMonthStart = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime currentMonthEnd = currentMonth.atEndOfMonth().atTime(23, 59, 59);
        LocalDateTime previousMonthStart = previousMonth.atDay(1).atStartOfDay();
        LocalDateTime previousMonthEnd = previousMonth.atEndOfMonth().atTime(23, 59, 59);

        // Get all bookings for this guide
        List<Booking> allBookings = bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId);

        // 1. Monthly Bookings - count bookings where schedule.startDateTime is in the
        // month
        long currentMonthBookings = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getStartDateTime() != null)
                .filter(b -> {
                    LocalDateTime start = b.getExperienceSchedule().getStartDateTime();
                    return !start.isBefore(currentMonthStart) && !start.isAfter(currentMonthEnd);
                })
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .count();

        long previousMonthBookings = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getStartDateTime() != null)
                .filter(b -> {
                    LocalDateTime start = b.getExperienceSchedule().getStartDateTime();
                    return !start.isBefore(previousMonthStart) && !start.isAfter(previousMonthEnd);
                })
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .count();

        double bookingsChangePercent = calculateChangePercent(currentMonthBookings, previousMonthBookings);
        GuideDashboardMetricsDTO.MetricChange monthlyBookings = new GuideDashboardMetricsDTO.MetricChange(
                currentMonthBookings, previousMonthBookings, bookingsChangePercent);

        // 2. Cancellation Rate - current month
        long currentCancelledByGuide = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getStartDateTime() != null)
                .filter(b -> {
                    LocalDateTime start = b.getExperienceSchedule().getStartDateTime();
                    return !start.isBefore(currentMonthStart) && !start.isAfter(currentMonthEnd);
                })
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED_BY_GUIDE)
                .count();

        long currentTotalBookings = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getStartDateTime() != null)
                .filter(b -> {
                    LocalDateTime start = b.getExperienceSchedule().getStartDateTime();
                    return !start.isBefore(currentMonthStart) && !start.isAfter(currentMonthEnd);
                })
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED ||
                        b.getStatus() == BookingStatus.COMPLETED ||
                        b.getStatus() == BookingStatus.CANCELLED_BY_TOURIST ||
                        b.getStatus() == BookingStatus.CANCELLED_BY_GUIDE)
                .count();

        double currentCancellationRate = currentTotalBookings > 0
                ? (currentCancelledByGuide * 100.0 / currentTotalBookings)
                : 0.0;

        // Previous month cancellation rate
        long previousCancelledByGuide = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getStartDateTime() != null)
                .filter(b -> {
                    LocalDateTime start = b.getExperienceSchedule().getStartDateTime();
                    return !start.isBefore(previousMonthStart) && !start.isAfter(previousMonthEnd);
                })
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED_BY_GUIDE)
                .count();

        long previousTotalBookings = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getStartDateTime() != null)
                .filter(b -> {
                    LocalDateTime start = b.getExperienceSchedule().getStartDateTime();
                    return !start.isBefore(previousMonthStart) && !start.isAfter(previousMonthEnd);
                })
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED ||
                        b.getStatus() == BookingStatus.COMPLETED ||
                        b.getStatus() == BookingStatus.CANCELLED_BY_TOURIST ||
                        b.getStatus() == BookingStatus.CANCELLED_BY_GUIDE)
                .count();

        double previousCancellationRate = previousTotalBookings > 0
                ? (previousCancelledByGuide * 100.0 / previousTotalBookings)
                : 0.0;

        double cancellationChangePercent = calculateChangePercent(currentCancellationRate, previousCancellationRate);
        GuideDashboardMetricsDTO.MetricChange cancellationRate = new GuideDashboardMetricsDTO.MetricChange(
                Math.round(currentCancellationRate * 10.0) / 10.0, // Round to 1 decimal
                Math.round(previousCancellationRate * 10.0) / 10.0,
                cancellationChangePercent);

        // 3. Total Experiences - just current count
        List<Experience> guideExperiences = experienceRepository.findByGuide_Id(guideId);
        Integer totalExperiences = guideExperiences.size();

        return new GuideDashboardMetricsDTO(monthlyBookings, cancellationRate, totalExperiences);
    }

    /**
     * Get profit chart data for the last 6 months
     * Profit is based on when tours were completed (schedule.endDateTime)
     */
    public List<ProfitChartDataDTO> getProfitChartData(Long guideId) {
        List<ProfitChartDataDTO> chartData = new ArrayList<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");

        // Get last 6 months in reverse order (oldest first for chart)
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            LocalDateTime monthStart = month.atDay(1).atStartOfDay();
            LocalDateTime monthEnd = month.atEndOfMonth().atTime(23, 59, 59);

            // Sum baseAmount from completed bookings where schedule.endDateTime is in this
            // month
            BigDecimal monthProfit = bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId).stream()
                    .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                    .filter(b -> b.getExperienceSchedule() != null
                            && b.getExperienceSchedule().getEndDateTime() != null)
                    .filter(b -> {
                        LocalDateTime end = b.getExperienceSchedule().getEndDateTime();
                        return !end.isBefore(monthStart) && !end.isAfter(monthEnd);
                    })
                    .map(b -> b.getBaseAmount() != null ? b.getBaseAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String monthName = month.format(monthFormatter);
            chartData.add(new ProfitChartDataDTO(monthName, monthProfit));
        }

        return chartData;
    }

    /**
     * Get top performing experiences by booking volume
     */
    public List<TopExperienceDTO> getTopExperiences(Long guideId) {
        // Get all experiences for this guide
        List<Experience> experiences = experienceRepository.findByGuide_Id(guideId);

        // Get all bookings for this guide
        List<Booking> allBookings = bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId);

        // Group bookings by experience and count
        Map<Long, Long> bookingCountByExperience = allBookings.stream()
                .filter(b -> b.getExperienceSchedule() != null && b.getExperienceSchedule().getExperience() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getExperienceSchedule().getExperience().getExperienceId(),
                        Collectors.counting()));

        // Create DTOs and sort by booking count
        List<TopExperienceDTO> topExperiences = experiences.stream()
                .map(exp -> {
                    Long bookingCount = bookingCountByExperience.getOrDefault(exp.getExperienceId(), 0L);
                    Double rating = exp.getAverageRating() != null ? exp.getAverageRating().doubleValue() : 0.0;

                    // Calculate conversion rate (bookings / views * 100)
                    Double conversionRate = 0.0;
                    Integer viewCount = exp.getViewCount() != null ? exp.getViewCount() : 0;
                    if (viewCount > 0) {
                        conversionRate = (bookingCount.doubleValue() / viewCount) * 100.0;
                        conversionRate = Math.round(conversionRate * 10.0) / 10.0; // Round to 1 decimal
                    }

                    return new TopExperienceDTO(
                            exp.getExperienceId(),
                            exp.getTitle(),
                            Integer.valueOf(bookingCount.intValue()),
                            rating,
                            exp.getCategory() != null ? exp.getCategory().name() : "OTHER",
                            conversionRate);
                })
                .sorted(Comparator.comparingInt(TopExperienceDTO::getBookings).reversed())
                .collect(Collectors.toList());

        return topExperiences;
    }

    /**
     * Helper method to calculate percentage change
     */
    private double calculateChangePercent(double current, double previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((current - previous) / previous) * 100.0;
    }
}
