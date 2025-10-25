package com.backend.controller;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceSchedule;
import com.backend.entity.ExperienceMedia;
import com.backend.entity.ExperienceItinerary;
import com.backend.entity.User;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.ExperienceMediaRepository;
import com.backend.repository.ExperienceItineraryRepository;
import com.backend.repository.BookingRepository;
import com.backend.repository.PersonalChatRepository;
import com.backend.dto.SearchSuggestionDTO;
import com.backend.service.ExperienceService;
import com.backend.service.ExperienceAnalyticsService;
import com.backend.entity.BookingStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {
    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private ExperienceMediaRepository experienceMediaRepository;

    @Autowired
    private ExperienceItineraryRepository experienceItineraryRepository;

    @Autowired
    private ExperienceService experienceService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PersonalChatRepository personalChatRepository;

    @Autowired
    private ExperienceAnalyticsService experienceAnalyticsService;

    @GetMapping
    public List<Map<String, Object>> getAllExperiences() {
        List<Experience> experiences = experienceRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Experience exp : experiences) {
            Map<String, Object> expMap = new HashMap<>();
            expMap.put("experienceId", exp.getExperienceId());
            expMap.put("title", exp.getTitle());
            expMap.put("location", exp.getLocation());
            expMap.put("country", exp.getCountry());
            expMap.put("latitude", exp.getLatitude());
            expMap.put("longitude", exp.getLongitude());
            expMap.put("price", exp.getPrice());
            expMap.put("totalStars", exp.getTotalStars());
            expMap.put("averageRating", exp.getAverageRating());
            expMap.put("coverPhotoUrl", exp.getCoverPhotoUrl());
            expMap.put("shortDescription", exp.getShortDescription());
            expMap.put("duration", exp.getDuration());
            expMap.put("category", exp.getCategory());
            expMap.put("status", exp.getStatus());
            expMap.put("totalReviews", exp.getTotalReviews());
            expMap.put("participantsAllowed", exp.getParticipantsAllowed());
            expMap.put("createdAt", exp.getCreatedAt());
            expMap.put("updatedAt", exp.getUpdatedAt());

            // Add guide info without lazy loading issues
            if (exp.getGuide() != null) {
                Map<String, Object> guideMap = new HashMap<>();
                guideMap.put("userId", exp.getGuide().getId());
                guideMap.put("firstName", exp.getGuide().getFirstName());
                guideMap.put("lastName", exp.getGuide().getLastName());
                guideMap.put("email", exp.getGuide().getEmail());
                guideMap.put("profileImageUrl", exp.getGuide().getProfileImageUrl());
                expMap.put("guide", guideMap);
            }

            result.add(expMap);
        }

        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getExperienceById(@PathVariable Long id) {
        try {
            Experience exp = experienceRepository.findById(id).orElse(null);
            if (exp == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "error", "Experience not found"));
            }

            Map<String, Object> expMap = new HashMap<>();
            expMap.put("experienceId", exp.getExperienceId());
            expMap.put("title", exp.getTitle());
            expMap.put("location", exp.getLocation());
            expMap.put("country", exp.getCountry());
            expMap.put("latitude", exp.getLatitude());
            expMap.put("longitude", exp.getLongitude());
            expMap.put("price", exp.getPrice());
            expMap.put("totalStars", exp.getTotalStars());
            expMap.put("averageRating", exp.getAverageRating());
            expMap.put("coverPhotoUrl", exp.getCoverPhotoUrl());
            expMap.put("shortDescription", exp.getShortDescription());
            expMap.put("fullDescription", exp.getFullDescription());
            expMap.put("duration", exp.getDuration());
            expMap.put("category", exp.getCategory());
            expMap.put("status", exp.getStatus());
            expMap.put("totalReviews", exp.getTotalReviews());
            expMap.put("highlights", exp.getHighlights());
            expMap.put("whatIncluded", exp.getWhatIncluded());
            expMap.put("importantInfo", exp.getImportantInfo());
            expMap.put("cancellationPolicy", exp.getCancellationPolicy());
            expMap.put("participantsAllowed", exp.getParticipantsAllowed());
            expMap.put("tags", exp.getTags());
            expMap.put("createdAt", exp.getCreatedAt());
            expMap.put("updatedAt", exp.getUpdatedAt());

            // Add guide info without lazy loading issues
            if (exp.getGuide() != null) {
                Map<String, Object> guideMap = new HashMap<>();
                guideMap.put("userId", exp.getGuide().getId());
                guideMap.put("firstName", exp.getGuide().getFirstName());
                guideMap.put("lastName", exp.getGuide().getLastName());
                guideMap.put("email", exp.getGuide().getEmail());
                guideMap.put("profileImageUrl", exp.getGuide().getProfileImageUrl());
                expMap.put("guide", guideMap);
            }

            return ResponseEntity.ok(expMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch experience: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createExperience(@RequestBody Map<String, Object> payload) {
        try {
            Experience createdExperience = experienceService.createCompleteExperience(payload);
            return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "experienceId", createdExperience.getExperienceId(),
                    "message", "Experience created successfully",
                    "experience", createdExperience));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to create experience: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public Experience updateExperience(@PathVariable Long id, @RequestBody Experience experience) {
        experience.setExperienceId(id);
        return experienceRepository.save(experience);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> updateCompleteExperience(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Experience updatedExperience = experienceService.updateCompleteExperience(id, payload);
            return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "experienceId", updatedExperience.getExperienceId(),
                    "message", "Experience updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to update experience: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteExperience(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Invalid experience ID"));
            }

            // Check if experience exists
            Experience experience = experienceRepository.findById(id).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }

            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            // Verify that the current user owns this experience
            User guide = experience.getGuide();
            if (guide == null || !guide.getEmail().equals(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "success", false,
                        "message", "You are not authorized to delete this experience"));
            }

            // Check if experience has any bookings
            boolean hasBookings = bookingRepository.existsByExperienceId(id);
            if (hasBookings) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "success", false,
                        "message", "Cannot delete experience with existing bookings"));
            }

            // Nullify experience references in personal chats to preserve chat history
            List<com.backend.entity.PersonalChat> relatedChats = personalChatRepository.findAll()
                    .stream()
                    .filter(chat -> chat.getExperience() != null && chat.getExperience().getExperienceId().equals(id))
                    .collect(Collectors.toList());

            for (com.backend.entity.PersonalChat chat : relatedChats) {
                // Preserve the original experience title before nullifying the reference
                if (chat.getExperience() != null && chat.getExperience().getTitle() != null) {
                    chat.setName(chat.getExperience().getTitle() + " (Experience Deleted)");
                }
                chat.setExperience(null);
                personalChatRepository.save(chat);
            }

            // If all checks pass, delete the experience
            experienceRepository.deleteById(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Experience deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to delete experience: " + e.getMessage()));
        }
    }

    @GetMapping("/search/suggestions")
    public List<SearchSuggestionDTO> getSearchSuggestions(@RequestParam String q) {
        List<SearchSuggestionDTO> suggestions = new ArrayList<>();

        // Return empty list if query is too short
        if (q == null || q.trim().length() < 2) {
            return suggestions;
        }

        String query = q.trim();

        // Get country suggestions (limit to 3)
        List<String> countries = experienceRepository.findLocationSuggestions(query);
        suggestions.addAll(countries.stream()
                .limit(3)
                .map(SearchSuggestionDTO::location)
                .collect(Collectors.toList()));

        // Get experience suggestions (limit to 2)
        List<Experience> experiences = experienceRepository.findExperienceSuggestions(query);
        suggestions.addAll(experiences.stream()
                .limit(2)
                .map(exp -> SearchSuggestionDTO.experience(exp.getTitle(), exp.getCountry(), exp.getExperienceId()))
                .collect(Collectors.toList()));

        // Limit total suggestions to 5
        return suggestions.stream().limit(5).collect(Collectors.toList());
    }

    @GetMapping("/{id}/schedules")
    public List<Map<String, Object>> getSchedulesByExperienceId(@PathVariable Long id) {
        List<ExperienceSchedule> schedules = experienceScheduleRepository
                .findByExperience_ExperienceIdOrderByStartDateTimeAsc(id);

        List<Map<String, Object>> result = new ArrayList<>();
        for (ExperienceSchedule schedule : schedules) {
            Map<String, Object> scheduleMap = new HashMap<>();
            scheduleMap.put("scheduleId", schedule.getScheduleId());
            scheduleMap.put("startDateTime", schedule.getStartDateTime());
            scheduleMap.put("endDateTime", schedule.getEndDateTime());
            scheduleMap.put("availableSpots", schedule.getAvailableSpots());
            scheduleMap.put("isAvailable", schedule.getIsAvailable());
            scheduleMap.put("createdAt", schedule.getCreatedAt());
            result.add(scheduleMap);
        }

        return result;
    }

    // Separate endpoints for related data
    @GetMapping("/{id}/media")
    public ResponseEntity<?> getExperienceMedia(@PathVariable Long id) {
        try {
            // Check if experience exists first
            if (!experienceRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            // Use repository to avoid lazy loading issues
            List<ExperienceMedia> mediaList = experienceMediaRepository.findByExperienceId(id);

            // Create safe response objects to avoid circular references
            List<Map<String, Object>> safeMediaList = mediaList.stream().map(media -> {
                Map<String, Object> mediaMap = new HashMap<>();
                mediaMap.put("mediaId", media.getMediaId());
                mediaMap.put("mediaUrl", media.getMediaUrl());
                mediaMap.put("mediaType", media.getMediaType());
                mediaMap.put("caption", media.getCaption());
                mediaMap.put("displayOrder", media.getDisplayOrder());
                return mediaMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(safeMediaList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch media: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/itineraries")
    public ResponseEntity<?> getExperienceItineraries(@PathVariable Long id) {
        try {
            // Check if experience exists first
            if (!experienceRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            // Use repository to avoid lazy loading issues
            List<ExperienceItinerary> itineraryList = experienceItineraryRepository.findByExperienceId(id);

            // Create safe response objects to avoid circular references
            List<Map<String, Object>> safeItineraryList = itineraryList.stream().map(itinerary -> {
                Map<String, Object> itineraryMap = new HashMap<>();
                itineraryMap.put("itineraryId", itinerary.getItineraryId());
                itineraryMap.put("stopOrder", itinerary.getStopOrder());
                itineraryMap.put("stopType", itinerary.getStopType());
                itineraryMap.put("locationName", itinerary.getLocationName());
                itineraryMap.put("duration", itinerary.getDuration());
                return itineraryMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(safeItineraryList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch itineraries: " + e.getMessage()));
        }
    }

    @GetMapping("/guide/{guideId}")
    public ResponseEntity<List<Map<String, Object>>> getExperiencesByGuideId(@PathVariable Long guideId) {
        try {
            List<Experience> experiences = experienceRepository.findByGuide_Id(guideId);
            List<Map<String, Object>> result = new ArrayList<>();

            for (Experience exp : experiences) {
                Map<String, Object> expMap = new HashMap<>();
                expMap.put("experienceId", exp.getExperienceId());
                expMap.put("title", exp.getTitle());
                expMap.put("location", exp.getLocation());
                expMap.put("country", exp.getCountry());
                expMap.put("price", exp.getPrice());
                expMap.put("totalStars", exp.getTotalStars());
                expMap.put("averageRating", exp.getAverageRating());
                expMap.put("coverPhotoUrl", exp.getCoverPhotoUrl());
                expMap.put("shortDescription", exp.getShortDescription());
                expMap.put("duration", exp.getDuration());
                expMap.put("category", exp.getCategory());
                expMap.put("status", exp.getStatus());
                expMap.put("totalReviews", exp.getTotalReviews());
                expMap.put("participantsAllowed", exp.getParticipantsAllowed());
                expMap.put("createdAt", exp.getCreatedAt());
                expMap.put("updatedAt", exp.getUpdatedAt());

                // Add guide info without lazy loading issues
                if (exp.getGuide() != null) {
                    Map<String, Object> guideMap = new HashMap<>();
                    guideMap.put("userId", exp.getGuide().getId());
                    guideMap.put("firstName", exp.getGuide().getFirstName());
                    guideMap.put("lastName", exp.getGuide().getLastName());
                    guideMap.put("email", exp.getGuide().getEmail());
                    guideMap.put("profileImageUrl", exp.getGuide().getProfileImageUrl());
                    expMap.put("guide", guideMap);
                }

                result.add(expMap);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // Booking status endpoints for edit experience restrictions
    @GetMapping("/{id}/booking-status")
    public ResponseEntity<Map<String, Object>> getExperienceBookingStatus(@PathVariable Long id) {
        try {
            // Check if experience exists
            if (!experienceRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            // Check for active bookings (CONFIRMED and COMPLETED only)
            List<BookingStatus> activeStatuses = List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

            // Get all schedules for this experience
            List<ExperienceSchedule> schedules = experienceScheduleRepository
                    .findByExperience_ExperienceIdOrderByStartDateTimeAsc(id);

            boolean hasActiveBookings = false;
            for (ExperienceSchedule schedule : schedules) {
                if (!bookingRepository.findByScheduleIdAndStatusIn(schedule.getScheduleId(), activeStatuses).isEmpty()) {
                    hasActiveBookings = true;
                    break;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("experienceId", id);
            response.put("hasActiveBookings", hasActiveBookings);
            response.put("restrictGlobalFields", hasActiveBookings); // price, country, participantsAllowed

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to check booking status: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/schedules/booking-status")
    public ResponseEntity<Map<String, Object>> getScheduleBookingStatuses(@PathVariable Long id) {
        try {
            // Check if experience exists
            if (!experienceRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            // Get all schedules for this experience
            List<ExperienceSchedule> schedules = experienceScheduleRepository
                    .findByExperience_ExperienceIdOrderByStartDateTimeAsc(id);

            // Check for active bookings (CONFIRMED and COMPLETED only)
            List<BookingStatus> activeStatuses = List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

            List<Map<String, Object>> scheduleStatuses = new ArrayList<>();
            boolean hasAnyActiveBookings = false;

            for (ExperienceSchedule schedule : schedules) {
                boolean hasActiveBookings = !bookingRepository
                        .findByScheduleIdAndStatusIn(schedule.getScheduleId(), activeStatuses).isEmpty();

                if (hasActiveBookings) {
                    hasAnyActiveBookings = true;
                }

                Map<String, Object> scheduleStatus = new HashMap<>();
                scheduleStatus.put("scheduleId", schedule.getScheduleId());
                scheduleStatus.put("startDateTime", schedule.getStartDateTime());
                scheduleStatus.put("endDateTime", schedule.getEndDateTime());
                scheduleStatus.put("hasActiveBookings", hasActiveBookings);
                scheduleStatus.put("canEdit", !hasActiveBookings);
                scheduleStatus.put("canDelete", !hasActiveBookings);

                scheduleStatuses.add(scheduleStatus);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("experienceId", id);
            response.put("schedules", scheduleStatuses);
            response.put("hasAnyActiveBookings", hasAnyActiveBookings);
            response.put("restrictGlobalFields", hasAnyActiveBookings); // price, country, participantsAllowed

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to check schedule booking statuses: " + e.getMessage()));
        }
    }

    /**
     * Increment view count for an experience
     * Public endpoint - no authentication required
     */
    @PostMapping("/{id}/increment-view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable Long id) {
        try {
            experienceAnalyticsService.incrementViewCount(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("ERROR in ExperienceController.incrementViewCount: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

}
