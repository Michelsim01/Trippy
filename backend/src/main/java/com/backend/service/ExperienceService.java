package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Experience createCompleteExperience(Map<String, Object> payload) {
        try {
            System.out.println("Starting createCompleteExperience with payload: " + payload);

            // Extract main experience data
            Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");
            System.out.println("Experience data: " + experienceData);

            // Create Experience entity
            Experience experience = new Experience();

            // Set guide from authenticated user
            User currentUser = getCurrentAuthenticatedUser();
            if (currentUser != null) {
                experience.setGuide(currentUser);
                System.out.println("Setting guide: " + currentUser.getFirstName() + " " + currentUser.getLastName()
                        + " (ID: " + currentUser.getId() + ")");
            } else {
                System.out.println("No authenticated user found - experience will have no guide");
            }

            experience.setTitle((String) experienceData.get("title"));
            experience.setShortDescription((String) experienceData.get("shortDescription"));
            experience.setFullDescription((String) experienceData.get("fullDescription"));
            experience.setHighlights((String) experienceData.get("highlights"));
            experience.setCategory(
                    ExperienceCategory.valueOf((String) experienceData.getOrDefault("category", "ADVENTURE")));
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

            // Handle location data - can be String (legacy) or Object (new structure)
            Object locationObj = experienceData.get("location");
            if (locationObj instanceof String) {
                // Legacy format - just a string
                experience.setLocation((String) locationObj);
            } else if (locationObj instanceof Map) {
                // New format - object with coordinates
                Map<String, Object> locationData = (Map<String, Object>) locationObj;
                experience.setLocation((String) locationData.get("name"));
                
                // Set latitude if provided
                if (locationData.get("latitude") != null) {
                    Object latObj = locationData.get("latitude");
                    if (latObj instanceof Number) {
                        experience.setLatitude(java.math.BigDecimal.valueOf(((Number) latObj).doubleValue()));
                    } else if (latObj instanceof String) {
                        experience.setLatitude(new java.math.BigDecimal((String) latObj));
                    }
                }
                
                // Set longitude if provided
                if (locationData.get("longitude") != null) {
                    Object lngObj = locationData.get("longitude");
                    if (lngObj instanceof Number) {
                        experience.setLongitude(java.math.BigDecimal.valueOf(((Number) lngObj).doubleValue()));
                    } else if (lngObj instanceof String) {
                        experience.setLongitude(new java.math.BigDecimal((String) lngObj));
                    }
                }
                
                // Set country from location data if available
                if (locationData.get("country") != null) {
                    experience.setCountry((String) locationData.get("country"));
                }
            }
            
            // Fallback to country field if not set from location
            if (experience.getCountry() == null || experience.getCountry().isEmpty()) {
                experience.setCountry((String) experienceData.get("country"));
            }
            
            // Handle direct latitude and longitude fields (for backward compatibility)
            if (experienceData.get("latitude") != null && experience.getLatitude() == null) {
                Object latObj = experienceData.get("latitude");
                if (latObj instanceof Number) {
                    experience.setLatitude(java.math.BigDecimal.valueOf(((Number) latObj).doubleValue()));
                } else if (latObj instanceof String) {
                    experience.setLatitude(new java.math.BigDecimal((String) latObj));
                }
            }
            
            if (experienceData.get("longitude") != null && experience.getLongitude() == null) {
                Object lngObj = experienceData.get("longitude");
                if (lngObj instanceof Number) {
                    experience.setLongitude(java.math.BigDecimal.valueOf(((Number) lngObj).doubleValue()));
                } else if (lngObj instanceof String) {
                    experience.setLongitude(new java.math.BigDecimal((String) lngObj));
                }
            }
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

                        // Support both new format (startDateTime/endDateTime) and old format
                        // (date/startTime/endTime)
                        if (scheduleData.containsKey("startDateTime") && scheduleData.containsKey("endDateTime")) {
                            // New format: Parse ISO datetime strings
                            String startDateTimeStr = (String) scheduleData.get("startDateTime");
                            String endDateTimeStr = (String) scheduleData.get("endDateTime");

                            LocalDateTime startDateTime = LocalDateTime.parse(startDateTimeStr,
                                    DateTimeFormatter.ISO_DATE_TIME);
                            LocalDateTime endDateTime = LocalDateTime.parse(endDateTimeStr,
                                    DateTimeFormatter.ISO_DATE_TIME);

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
                            System.out.println(
                                    "Using old format - Date: " + date + ", Start: " + startTime + ", End: " + endTime);
                        }

                        schedule.setAvailableSpots((Integer) scheduleData.get("availableSpots"));
                        schedule.setIsAvailable((Boolean) scheduleData.get("isAvailable"));
                        ExperienceSchedule savedSchedule = experienceScheduleRepository.save(schedule);
                        System.out.println("Saved schedule: " + savedSchedule.getStartDateTime() + " to "
                                + savedSchedule.getEndDateTime());
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

        // Delete existing related data (except schedules - they will be smartly updated)
        experienceMediaRepository.deleteByExperienceId(experienceId);
        experienceItineraryRepository.deleteByExperienceId(experienceId);

        // Extract main experience data
        Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");

        // Update Experience entity with new data (but keep the original guide)
        // Note: We don't update the guide during experience updates to preserve
        // ownership
        existingExperience.setTitle((String) experienceData.get("title"));
        existingExperience.setShortDescription((String) experienceData.get("shortDescription"));
        existingExperience.setFullDescription((String) experienceData.get("fullDescription"));
        existingExperience.setHighlights((String) experienceData.get("highlights"));
        existingExperience
                .setCategory(ExperienceCategory.valueOf((String) experienceData.getOrDefault("category", "ADVENTURE")));
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

        // Handle location data - can be String (legacy) or Object (new structure)
        Object locationObj = experienceData.get("location");
        if (locationObj instanceof String) {
            // Legacy format - just a string
            existingExperience.setLocation((String) locationObj);
        } else if (locationObj instanceof Map) {
            // New format - object with coordinates
            Map<String, Object> locationData = (Map<String, Object>) locationObj;
            existingExperience.setLocation((String) locationData.get("name"));
            
            // Set latitude if provided
            if (locationData.get("latitude") != null) {
                Object latObj = locationData.get("latitude");
                if (latObj instanceof Number) {
                    existingExperience.setLatitude(java.math.BigDecimal.valueOf(((Number) latObj).doubleValue()));
                } else if (latObj instanceof String) {
                    existingExperience.setLatitude(new java.math.BigDecimal((String) latObj));
                }
            }
            
            // Set longitude if provided
            if (locationData.get("longitude") != null) {
                Object lngObj = locationData.get("longitude");
                if (lngObj instanceof Number) {
                    existingExperience.setLongitude(java.math.BigDecimal.valueOf(((Number) lngObj).doubleValue()));
                } else if (lngObj instanceof String) {
                    existingExperience.setLongitude(new java.math.BigDecimal((String) lngObj));
                }
            }
            
            // Set country from location data if available
            if (locationData.get("country") != null) {
                existingExperience.setCountry((String) locationData.get("country"));
            }
        }
        
        // Fallback to country field if not set from location
        if (existingExperience.getCountry() == null || existingExperience.getCountry().isEmpty()) {
            existingExperience.setCountry((String) experienceData.get("country"));
        }
        
        // Handle direct latitude and longitude fields (for backward compatibility)
        if (experienceData.get("latitude") != null && existingExperience.getLatitude() == null) {
            Object latObj = experienceData.get("latitude");
            if (latObj instanceof Number) {
                existingExperience.setLatitude(java.math.BigDecimal.valueOf(((Number) latObj).doubleValue()));
            } else if (latObj instanceof String) {
                existingExperience.setLatitude(new java.math.BigDecimal((String) latObj));
            }
        }
        
        if (experienceData.get("longitude") != null && existingExperience.getLongitude() == null) {
            Object lngObj = experienceData.get("longitude");
            if (lngObj instanceof Number) {
                existingExperience.setLongitude(java.math.BigDecimal.valueOf(((Number) lngObj).doubleValue()));
            } else if (lngObj instanceof String) {
                existingExperience.setLongitude(new java.math.BigDecimal((String) lngObj));
            }
        }
        existingExperience
                .setStatus(ExperienceStatus.valueOf((String) experienceData.getOrDefault("status", "ACTIVE")));
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

        // Smart schedule update logic - preserves existing schedule IDs and relationships
        List<Map<String, Object>> schedules = (List<Map<String, Object>>) payload.get("schedules");
        System.out.println("Processing schedules with smart update. Count: " + (schedules != null ? schedules.size() : "null"));

        if (schedules != null && !schedules.isEmpty()) {
            // Get existing schedules from database
            List<ExperienceSchedule> existingSchedules = experienceScheduleRepository.findByExperience_ExperienceIdOrderByStartDateTimeAsc(experienceId);
            List<Long> incomingScheduleIds = new ArrayList<>();

            // Process each incoming schedule
            for (Map<String, Object> scheduleData : schedules) {
                try {
                    // Extract schedule ID - could be existing DB ID or temp frontend ID
                    final Long scheduleId;
                    Object scheduleIdObj = scheduleData.get("scheduleId");
                    if (scheduleIdObj != null) {
                        scheduleId = scheduleIdObj instanceof Number ? ((Number) scheduleIdObj).longValue() : null;
                    } else {
                        scheduleId = null;
                    }

                    boolean isNewSchedule = scheduleData.containsKey("isNew") && (Boolean) scheduleData.get("isNew");
                    boolean isExistingDatabaseSchedule = scheduleId != null && scheduleId < 1000000000000L && !isNewSchedule;

                    if (isExistingDatabaseSchedule) {
                        // UPDATE existing schedule - preserve the schedule ID and relationships
                        ExperienceSchedule existingSchedule = existingSchedules.stream()
                                .filter(s -> s.getScheduleId().equals(scheduleId))
                                .findFirst()
                                .orElse(null);

                        if (existingSchedule != null) {
                            updateScheduleFromData(existingSchedule, scheduleData);
                            ExperienceSchedule savedSchedule = experienceScheduleRepository.save(existingSchedule);
                            incomingScheduleIds.add(savedSchedule.getScheduleId());
                            System.out.println("UPDATED existing schedule ID " + scheduleId + ": " +
                                    savedSchedule.getStartDateTime() + " to " + savedSchedule.getEndDateTime());
                        } else {
                            System.out.println("Warning: Schedule ID " + scheduleId + " not found in database, treating as new");
                            createNewScheduleFromData(updatedExperience, scheduleData, incomingScheduleIds);
                        }
                    } else {
                        // INSERT new schedule - generate new database ID
                        createNewScheduleFromData(updatedExperience, scheduleData, incomingScheduleIds);
                    }
                } catch (Exception e) {
                    System.err.println("Error processing schedule: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            // DELETE schedules not in incoming list (with booking validation)
            for (ExperienceSchedule existingSchedule : existingSchedules) {
                if (!incomingScheduleIds.contains(existingSchedule.getScheduleId())) {
                    // Check if schedule has bookings before deleting
                    if (existingSchedule.getBookings() != null && !existingSchedule.getBookings().isEmpty()) {
                        System.out.println("WARNING: Cannot delete schedule ID " + existingSchedule.getScheduleId() +
                                " - it has " + existingSchedule.getBookings().size() + " existing bookings");
                        // Keep the schedule to preserve booking relationships
                    } else {
                        experienceScheduleRepository.delete(existingSchedule);
                        System.out.println("DELETED unused schedule ID " + existingSchedule.getScheduleId());
                    }
                }
            }
        } else {
            System.out.println("No schedules to update - schedules list is null or empty");
        }

        return updatedExperience;
    }

    // Helper method to update an existing schedule with new data
    private void updateScheduleFromData(ExperienceSchedule schedule, Map<String, Object> scheduleData) {
        // Update datetime fields
        if (scheduleData.containsKey("startDateTime") && scheduleData.containsKey("endDateTime")) {
            // New format: Parse ISO datetime strings
            String startDateTimeStr = (String) scheduleData.get("startDateTime");
            String endDateTimeStr = (String) scheduleData.get("endDateTime");

            LocalDateTime startDateTime = LocalDateTime.parse(startDateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
            LocalDateTime endDateTime = LocalDateTime.parse(endDateTimeStr, DateTimeFormatter.ISO_DATE_TIME);

            schedule.setStartDateTime(startDateTime);
            schedule.setEndDateTime(endDateTime);
        } else {
            // Old format: Parse separate date, startTime, endTime fields
            LocalDate date = LocalDate.parse((String) scheduleData.get("date"));
            LocalTime startTime = LocalTime.parse((String) scheduleData.get("startTime"));
            LocalTime endTime = LocalTime.parse((String) scheduleData.get("endTime"));

            schedule.setStartDateTime(LocalDateTime.of(date, startTime));
            schedule.setEndDateTime(LocalDateTime.of(date, endTime));
        }

        // Update other fields
        schedule.setAvailableSpots((Integer) scheduleData.get("availableSpots"));
        schedule.setIsAvailable((Boolean) scheduleData.get("isAvailable"));
    }

    // Helper method to create a new schedule from data
    private void createNewScheduleFromData(Experience experience, Map<String, Object> scheduleData, List<Long> incomingScheduleIds) {
        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setExperience(experience);

        // Update with data using the same logic as update
        updateScheduleFromData(schedule, scheduleData);

        ExperienceSchedule savedSchedule = experienceScheduleRepository.save(schedule);
        incomingScheduleIds.add(savedSchedule.getScheduleId());

        System.out.println("CREATED new schedule ID " + savedSchedule.getScheduleId() + ": " +
                savedSchedule.getStartDateTime() + " to " + savedSchedule.getEndDateTime());
    }

    /**
     * Helper method to get the currently authenticated user
     * 
     * @return User entity if authenticated, null otherwise
     */
    private User getCurrentAuthenticatedUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    authentication.getPrincipal() instanceof UserDetails) {

                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String email = userDetails.getUsername();

                return userRepository.findByEmailAndIsActive(email, true).orElse(null);
            }
        } catch (Exception e) {
            System.err.println("Error getting authenticated user: " + e.getMessage());
        }
        return null;
    }
}