package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ExperienceService {
    
    @Autowired
    private ExperienceRepository experienceRepository;
    
    @Autowired
    private ExperienceItineraryRepository experienceItineraryRepository;
    
    @Autowired
    private ExperienceMediaRepository experienceMediaRepository;
    
    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Transactional
    public Experience createCompleteExperience(Map<String, Object> payload) {
        try {
            System.out.println("Starting createCompleteExperience with payload: " + payload);
            
            // Extract main experience data
            Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");
            System.out.println("Experience data: " + experienceData);
        
        // Create Experience entity
        Experience experience = new Experience();
        
        // TODO: Set guide from authenticated user when auth is implemented
        // For now, guide is nullable in the database
        // experience.setGuide(currentUser);
        
        experience.setTitle((String) experienceData.get("title"));
        experience.setShortDescription((String) experienceData.get("shortDescription"));
        experience.setFullDescription((String) experienceData.get("fullDescription"));
        experience.setHighlights((String) experienceData.get("highlights"));
        experience.setCategory(ExperienceCategory.valueOf((String) experienceData.getOrDefault("category", "ADVENTURE")));
        experience.setTags((List<String>) experienceData.get("tags"));
        experience.setCoverPhotoUrl((String) experienceData.get("coverPhotoUrl"));
        experience.setWhatIncluded((String) experienceData.get("whatIncluded"));
        experience.setImportantInfo((String) experienceData.get("importantInfo"));
        // Handle price - check for null
        Object priceObj = experienceData.get("price");
        if (priceObj != null && priceObj instanceof Number) {
            experience.setPrice(java.math.BigDecimal.valueOf(((Number) priceObj).doubleValue()));
        }
        
        // Handle participants allowed - check for null
        Object participantsObj = experienceData.get("participantsAllowed");
        if (participantsObj != null && participantsObj instanceof Integer) {
            experience.setParticipantsAllowed((Integer) participantsObj);
        }
        
        // Handle duration - set from payload or use default
        Object durationObj = experienceData.get("duration");
        if (durationObj != null && durationObj instanceof Number) {
            experience.setDuration(java.math.BigDecimal.valueOf(((Number) durationObj).doubleValue()));
        } else {
            // If no duration provided, use default of 3 hours
            experience.setDuration(java.math.BigDecimal.valueOf(3));
        }
        
        experience.setLocation((String) experienceData.get("location"));
        experience.setCountry((String) experienceData.get("country"));
        experience.setStatus(ExperienceStatus.valueOf((String) experienceData.getOrDefault("status", "ACTIVE")));
        experience.setCreatedAt(LocalDateTime.now());
        experience.setUpdatedAt(LocalDateTime.now());
        
        // Save main experience first to get ID
        Experience savedExperience = experienceRepository.save(experience);
        
        // Create and save itinerary items
        List<Map<String, Object>> itineraries = (List<Map<String, Object>>) payload.get("itineraries");
        if (itineraries != null) {
            for (Map<String, Object> itineraryData : itineraries) {
                ExperienceItinerary itinerary = new ExperienceItinerary();
                itinerary.setExperience(savedExperience);
                itinerary.setStopOrder((Integer) itineraryData.get("stopOrder"));
                
                String stopType = (String) itineraryData.get("stopType");
                itinerary.setStopType(stopType != null ? stopType : "stop"); // Default to 'stop' if null
                
                itinerary.setLocationName((String) itineraryData.get("locationName"));
                
                // Handle duration - start and end items don't require duration
                String duration = (String) itineraryData.get("duration");
                if ("start".equals(stopType) || "end".equals(stopType)) {
                    itinerary.setDuration(null); // Start and end points don't have duration
                } else {
                    itinerary.setDuration(duration);
                }
                
                experienceItineraryRepository.save(itinerary);
            }
        }
        
        // Create and save media items
        List<Map<String, Object>> mediaList = (List<Map<String, Object>>) payload.get("media");
        if (mediaList != null) {
            for (Map<String, Object> mediaData : mediaList) {
                ExperienceMedia media = new ExperienceMedia();
                media.setExperience(savedExperience);
                media.setMediaUrl((String) mediaData.get("mediaUrl"));
                media.setMediaType(MediaType.valueOf((String) mediaData.get("mediaType")));
                media.setCaption((String) mediaData.get("caption"));
                media.setDisplayOrder((Integer) mediaData.get("displayOrder"));
                experienceMediaRepository.save(media);
            }
        }
        
        // Create and save schedule items
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) payload.get("schedules");
        System.out.println("Processing schedules. Count: " + (schedules != null ? schedules.size() : "null"));

        if (schedules != null && !schedules.isEmpty()) {
            for (Map<String, Object> scheduleData : schedules) {
                try {
                    ExperienceSchedule schedule = new ExperienceSchedule();
                    schedule.setExperience(savedExperience);

                    // Support both new format (startDateTime/endDateTime) and old format (date/startTime/endTime)
                    if (scheduleData.containsKey("startDateTime") && scheduleData.containsKey("endDateTime")) {
                        // New format: Parse ISO datetime strings
                        String startDateTimeStr = (String) scheduleData.get("startDateTime");
                        String endDateTimeStr = (String) scheduleData.get("endDateTime");

                        LocalDateTime startDateTime = LocalDateTime.parse(startDateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
                        LocalDateTime endDateTime = LocalDateTime.parse(endDateTimeStr, DateTimeFormatter.ISO_DATE_TIME);

                        schedule.setStartDateTime(startDateTime);
                        schedule.setEndDateTime(endDateTime);
                        System.out.println("Using new format - Start: " + startDateTime + ", End: " + endDateTime);
                    } else {
                        // Old format: Parse separate date, startTime, endTime fields
                        LocalDate date = LocalDate.parse((String) scheduleData.get("date"));
                        LocalTime startTime = LocalTime.parse((String) scheduleData.get("startTime"));
                        LocalTime endTime = LocalTime.parse((String) scheduleData.get("endTime"));

                        schedule.setStartDateTime(LocalDateTime.of(date, startTime));
                        schedule.setEndDateTime(LocalDateTime.of(date, endTime));
                        System.out.println("Using old format - Date: " + date + ", Start: " + startTime + ", End: " + endTime);
                    }

                    schedule.setAvailableSpots((Integer) scheduleData.get("availableSpots"));
                    schedule.setIsAvailable((Boolean) scheduleData.get("isAvailable"));
                    ExperienceSchedule savedSchedule = experienceScheduleRepository.save(schedule);
                    System.out.println("Saved schedule: " + savedSchedule.getStartDateTime() + " to " + savedSchedule.getEndDateTime());
                } catch (Exception e) {
                    System.err.println("Error saving schedule: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("No schedules to save - schedules list is null or empty");
        }
        
        return savedExperience;
        } catch (Exception e) {
            System.err.println("Error in createCompleteExperience: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create experience: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Experience updateCompleteExperience(Long experienceId, Map<String, Object> payload) {
        // Get existing experience
        Experience existingExperience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new RuntimeException("Experience not found with id: " + experienceId));

        // Delete existing related data
        experienceMediaRepository.deleteByExperienceId(experienceId);
        experienceItineraryRepository.deleteByExperienceId(experienceId);
        experienceScheduleRepository.deleteByExperienceExperienceId(experienceId);

        // Extract main experience data
        Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");

        // Update Experience entity with new data
        existingExperience.setTitle((String) experienceData.get("title"));
        existingExperience.setShortDescription((String) experienceData.get("shortDescription"));
        existingExperience.setFullDescription((String) experienceData.get("fullDescription"));
        existingExperience.setHighlights((String) experienceData.get("highlights"));
        existingExperience.setCategory(ExperienceCategory.valueOf((String) experienceData.getOrDefault("category", "ADVENTURE")));
        existingExperience.setTags((List<String>) experienceData.get("tags"));
        existingExperience.setCoverPhotoUrl((String) experienceData.get("coverPhotoUrl"));
        existingExperience.setWhatIncluded((String) experienceData.get("whatIncluded"));
        existingExperience.setImportantInfo((String) experienceData.get("importantInfo"));

        // Handle price - check for null
        Object priceObj = experienceData.get("price");
        if (priceObj != null && priceObj instanceof Number) {
            existingExperience.setPrice(java.math.BigDecimal.valueOf(((Number) priceObj).doubleValue()));
        }

        // Handle participants allowed - check for null
        Object participantsObj = experienceData.get("participantsAllowed");
        if (participantsObj != null && participantsObj instanceof Integer) {
            existingExperience.setParticipantsAllowed((Integer) participantsObj);
        }

        // Handle duration - set from payload or use default
        Object durationObj = experienceData.get("duration");
        if (durationObj != null && durationObj instanceof Number) {
            existingExperience.setDuration(java.math.BigDecimal.valueOf(((Number) durationObj).doubleValue()));
        } else {
            // If no duration provided, use default of 3 hours
            existingExperience.setDuration(java.math.BigDecimal.valueOf(3));
        }

        existingExperience.setLocation((String) experienceData.get("location"));
        existingExperience.setCountry((String) experienceData.get("country"));
        existingExperience.setStatus(ExperienceStatus.valueOf((String) experienceData.getOrDefault("status", "ACTIVE")));
        existingExperience.setUpdatedAt(LocalDateTime.now());

        // Save updated experience
        Experience updatedExperience = experienceRepository.save(existingExperience);

        // Create and save new itinerary items
        List<Map<String, Object>> itineraries = (List<Map<String, Object>>) payload.get("itineraries");
        if (itineraries != null) {
            for (Map<String, Object> itineraryData : itineraries) {
                ExperienceItinerary itinerary = new ExperienceItinerary();
                itinerary.setExperience(updatedExperience);
                itinerary.setStopOrder((Integer) itineraryData.get("stopOrder"));

                String stopType = (String) itineraryData.get("stopType");
                itinerary.setStopType(stopType != null ? stopType : "stop");

                itinerary.setLocationName((String) itineraryData.get("locationName"));

                String duration = (String) itineraryData.get("duration");
                if ("start".equals(stopType) || "end".equals(stopType)) {
                    itinerary.setDuration(null);
                } else {
                    itinerary.setDuration(duration);
                }

                experienceItineraryRepository.save(itinerary);
            }
        }

        // Create and save new media items
        List<Map<String, Object>> mediaList = (List<Map<String, Object>>) payload.get("media");
        if (mediaList != null) {
            for (Map<String, Object> mediaData : mediaList) {
                ExperienceMedia media = new ExperienceMedia();
                media.setExperience(updatedExperience);
                media.setMediaUrl((String) mediaData.get("mediaUrl"));
                media.setMediaType(MediaType.valueOf((String) mediaData.get("mediaType")));
                media.setCaption((String) mediaData.get("caption"));
                media.setDisplayOrder((Integer) mediaData.get("displayOrder"));
                experienceMediaRepository.save(media);
            }
        }

        // Create and save new schedule items
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) payload.get("schedules");
        System.out.println("Processing schedules for update. Count: " + (schedules != null ? schedules.size() : "null"));

        if (schedules != null && !schedules.isEmpty()) {
            for (Map<String, Object> scheduleData : schedules) {
                try {
                    ExperienceSchedule schedule = new ExperienceSchedule();
                    schedule.setExperience(updatedExperience);

                    // Support both new format (startDateTime/endDateTime) and old format (date/startTime/endTime)
                    if (scheduleData.containsKey("startDateTime") && scheduleData.containsKey("endDateTime")) {
                        // New format: Parse ISO datetime strings
                        String startDateTimeStr = (String) scheduleData.get("startDateTime");
                        String endDateTimeStr = (String) scheduleData.get("endDateTime");

                        LocalDateTime startDateTime = LocalDateTime.parse(startDateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
                        LocalDateTime endDateTime = LocalDateTime.parse(endDateTimeStr, DateTimeFormatter.ISO_DATE_TIME);

                        schedule.setStartDateTime(startDateTime);
                        schedule.setEndDateTime(endDateTime);
                        System.out.println("Using new format for update - Start: " + startDateTime + ", End: " + endDateTime);
                    } else {
                        // Old format: Parse separate date, startTime, endTime fields
                        LocalDate date = LocalDate.parse((String) scheduleData.get("date"));
                        LocalTime startTime = LocalTime.parse((String) scheduleData.get("startTime"));
                        LocalTime endTime = LocalTime.parse((String) scheduleData.get("endTime"));

                        schedule.setStartDateTime(LocalDateTime.of(date, startTime));
                        schedule.setEndDateTime(LocalDateTime.of(date, endTime));
                        System.out.println("Using old format for update - Date: " + date + ", Start: " + startTime + ", End: " + endTime);
                    }

                    schedule.setAvailableSpots((Integer) scheduleData.get("availableSpots"));
                    schedule.setIsAvailable((Boolean) scheduleData.get("isAvailable"));
                    ExperienceSchedule savedSchedule = experienceScheduleRepository.save(schedule);
                    System.out.println("Updated schedule: " + savedSchedule.getStartDateTime() + " to " + savedSchedule.getEndDateTime());
                } catch (Exception e) {
                    System.err.println("Error updating schedule: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("No schedules to update - schedules list is null or empty");
        }

        return updatedExperience;
    }
}