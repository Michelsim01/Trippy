package com.backend.service;

import com.backend.dto.ExperienceViewsDTO;
import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.Experience;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.PersonalChatRepository;
import com.backend.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ExperienceAnalyticsService {

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PersonalChatRepository personalChatRepository;

    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    /**
     * Get view analytics for a specific experience
     * Returns metrics for the ExperienceViewsModal
     */
    public ExperienceViewsDTO getExperienceViews(Long experienceId, Long guideId) {
        // Verify that this experience belongs to the guide
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new RuntimeException("Experience not found"));

        if (!experience.getGuide().getId().equals(guideId)) {
            throw new RuntimeException("Unauthorized: Experience does not belong to this guide");
        }

        // 1. Total Views
        Integer totalViews = experience.getViewCount() != null ? experience.getViewCount() : 0;

        // 2. Total Bookings (CONFIRMED + COMPLETED)
        List<Booking> allBookings = bookingRepository.findByExperienceId(experienceId);
        long totalBookings = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .count();

        // 3. Chat Inquiries (count of personal chats for this experience)
        long chatInquiries = personalChatRepository.countByExperienceId(experienceId);

        // 4. Wishlist Adds
        long wishlistAdds = wishlistItemRepository.countByExperience_ExperienceId(experienceId);

        // 5. Average Party Size
        Double avgPartySizeDouble = bookingRepository.calculateAveragePartySizeByExperienceId(experienceId);
        BigDecimal averagePartySize = avgPartySizeDouble != null
                ? BigDecimal.valueOf(avgPartySizeDouble).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 6. Conversion Rate (bookings / views * 100)
        BigDecimal conversionRate;
        if (totalViews > 0) {
            conversionRate = BigDecimal.valueOf(totalBookings)
                    .divide(BigDecimal.valueOf(totalViews), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        } else {
            conversionRate = BigDecimal.ZERO;
        }

        return new ExperienceViewsDTO(
                totalViews,
                (int) totalBookings,
                (int) chatInquiries,
                (int) wishlistAdds,
                averagePartySize,
                conversionRate
        );
    }

    /**
     * Increment view count for an experience
     * Called when someone views the experience details page
     */
    @Transactional
    public void incrementViewCount(Long experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new RuntimeException("Experience not found"));

        Integer currentCount = experience.getViewCount() != null ? experience.getViewCount() : 0;
        experience.setViewCount(currentCount + 1);
        experienceRepository.save(experience);
    }
}
