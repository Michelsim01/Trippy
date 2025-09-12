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
        // Extract main experience data
        Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");
        
        // Create Experience entity
        Experience experience = new Experience();
        
        // TODO: Set guide from authenticated user when auth is implemented
        // For now, guide is nullable in the database
        // experience.setGuide(currentUser);
        
        experience.setTitle((String) experienceData.get("title"));
        experience.setShortDescription((String) experienceData.get("shortDescription"));
        experience.setFullDescription((String) experienceData.get("fullDescription"));
        experience.setHighlights((String) experienceData.get("highlights"));
        experience.setCategory(ExperienceCategory.valueOf((String) experienceData.get("category")));
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
        
        // Handle duration - check for null
        Object durationObj = experienceData.get("duration");
        if (durationObj != null && durationObj instanceof Number) {
            experience.setDuration(java.math.BigDecimal.valueOf(((Number) durationObj).doubleValue()));
        }
        experience.setLocation((String) experienceData.get("location"));
        experience.setStatus(ExperienceStatus.valueOf((String) experienceData.get("status")));
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
                itinerary.setStopType((String) itineraryData.get("stopType"));
                itinerary.setLocationName((String) itineraryData.get("locationName"));
                itinerary.setDuration((String) itineraryData.get("duration"));
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
        if (schedules != null) {
            for (Map<String, Object> scheduleData : schedules) {
                ExperienceSchedule schedule = new ExperienceSchedule();
                schedule.setExperience(savedExperience);
                schedule.setDate(LocalDate.parse((String) scheduleData.get("date")));
                schedule.setStartTime(LocalTime.parse((String) scheduleData.get("startTime")));
                schedule.setEndTime(LocalTime.parse((String) scheduleData.get("endTime")));
                schedule.setAvailableSpots((Integer) scheduleData.get("availableSpots"));
                schedule.setIsAvailable((Boolean) scheduleData.get("isAvailable"));
                experienceScheduleRepository.save(schedule);
            }
        }
        
        return savedExperience;
    }
}