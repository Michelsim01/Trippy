package com.backend.service;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceCategory;
import com.backend.entity.ExperienceStatus;
import com.backend.entity.User;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.ExperienceItineraryRepository;
import com.backend.repository.ExperienceMediaRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExperienceServiceTest {

        @Mock(lenient = true)
    private ExperienceRepository experienceRepository;
    
    @Mock(lenient = true)
    private UserRepository userRepository;
    
    @Mock(lenient = true)
    private ExperienceScheduleRepository experienceScheduleRepository;
    
    @Mock(lenient = true)
    private ExperienceItineraryRepository experienceItineraryRepository;
    
    @Mock(lenient = true)
    private ExperienceMediaRepository experienceMediaRepository;
    
    @Mock
    private SecurityContext securityContext;
    
    @Mock
    private Authentication authentication;
    
    @Mock
    private UserDetails userDetails;

    @InjectMocks
    private ExperienceService experienceService;

    @Test
    void testCreateCompleteExperience_ValidPayload_CreatesExperience() {
        // Arrange
        Experience savedExperience = createTestExperience(1L, "City Tour", null);
        Map<String, Object> payload = createTestPayload();
        
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(experienceRepository.save(any(Experience.class))).thenReturn(savedExperience);

        // Act
        Experience result = experienceService.createCompleteExperience(payload);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getExperienceId());
        assertEquals("City Tour", result.getTitle());

        verify(experienceRepository).save(any(Experience.class));
    }

    @Test
    void testCreateCompleteExperience_NoAuthenticatedUser_HandlesGracefully() {
        // Arrange
        Map<String, Object> payload = createTestPayload();
        Experience mockExperience = new Experience();
        mockExperience.setExperienceId(1L);
        
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(experienceRepository.save(any(Experience.class))).thenReturn(mockExperience);

        // Act
        Experience result = experienceService.createCompleteExperience(payload);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getExperienceId());
        verify(experienceRepository).save(any(Experience.class));
    }

    @Test
    void testUpdateCompleteExperience_ValidExperience_UpdatesExperience() {
        // Arrange
        Long experienceId = 1L;
        User guide = createTestUser(1L, "guide@example.com");
        Experience existingExperience = createTestExperience(experienceId, "Old Title", guide);
        Experience updatedExperience = createTestExperience(experienceId, "Updated Title", guide);
        
        Map<String, Object> payload = createTestPayload();
        
        when(experienceRepository.findById(experienceId)).thenReturn(Optional.of(existingExperience));
        when(experienceRepository.save(any(Experience.class))).thenReturn(updatedExperience);

        // Act
        Experience result = experienceService.updateCompleteExperience(experienceId, payload);

        // Assert
        assertNotNull(result);
        assertEquals(experienceId, result.getExperienceId());

        verify(experienceRepository).findById(experienceId);
        verify(experienceRepository).save(any(Experience.class));
        verify(experienceMediaRepository).deleteByExperienceId(experienceId);
        verify(experienceItineraryRepository).deleteByExperienceId(experienceId);
    }

    @Test
    void testUpdateCompleteExperience_NonExistentExperience_ThrowsException() {
        // Arrange
        Long experienceId = 999L;
        Map<String, Object> payload = createTestPayload();
        
        when(experienceRepository.findById(experienceId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> experienceService.updateCompleteExperience(experienceId, payload));
        assertEquals("Experience not found with id: " + experienceId, exception.getMessage());
    }

    @Test
    void testCreateCompleteExperience_WithNullPrice_HandlesGracefully() {
        // Arrange
        Experience savedExperience = createTestExperience(1L, "City Tour", null);
        
        Map<String, Object> payload = createTestPayload();
        @SuppressWarnings("unchecked")
        Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");
        experienceData.put("price", null); // Set price to null
        
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(experienceRepository.save(any(Experience.class))).thenReturn(savedExperience);

        // Act & Assert
        assertDoesNotThrow(() -> experienceService.createCompleteExperience(payload));
        
        verify(experienceRepository).save(any(Experience.class));
    }

    @Test
    void testCreateCompleteExperience_WithStringLocation_HandlesCorrectly() {
        // Arrange
        Experience savedExperience = createTestExperience(1L, "City Tour", null);
        
        Map<String, Object> payload = createTestPayload();
        @SuppressWarnings("unchecked")
        Map<String, Object> experienceData = (Map<String, Object>) payload.get("experience");
        experienceData.put("location", "Singapore City"); // String location instead of object
        
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(experienceRepository.save(any(Experience.class))).thenReturn(savedExperience);

        // Act & Assert
        assertDoesNotThrow(() -> experienceService.createCompleteExperience(payload));
        
        verify(experienceRepository).save(any(Experience.class));
    }

    // Helper methods to create test data
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("Guide");
        return user;
    }

    private Experience createTestExperience(Long id, String title, User guide) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle(title);
        experience.setGuide(guide);
        experience.setShortDescription("Test description");
        experience.setCategory(ExperienceCategory.ADVENTURE);
        experience.setPrice(new BigDecimal("100.00"));
        experience.setStatus(ExperienceStatus.ACTIVE);
        experience.setCreatedAt(LocalDateTime.now());
        experience.setUpdatedAt(LocalDateTime.now());
        return experience;
    }

    private Map<String, Object> createTestPayload() {
        Map<String, Object> payload = new HashMap<>();
        
        Map<String, Object> experienceData = new HashMap<>();
        experienceData.put("title", "City Tour");
        experienceData.put("shortDescription", "A great city tour");
        experienceData.put("fullDescription", "Experience the best of the city");
        experienceData.put("highlights", "Great views, local food");
        experienceData.put("category", "ADVENTURE");
        experienceData.put("tags", Arrays.asList("city", "walking", "culture"));
        experienceData.put("coverPhotoUrl", "http://example.com/photo.jpg");
        experienceData.put("whatIncluded", "Guide, snacks");
        experienceData.put("importantInfo", "Wear comfortable shoes");
        experienceData.put("price", 100.0);
        experienceData.put("participantsAllowed", 10);
        experienceData.put("duration", 3.0);
        experienceData.put("location", "Singapore");
        experienceData.put("country", "Singapore");
        experienceData.put("status", "ACTIVE");
        
        payload.put("experience", experienceData);
        payload.put("itineraries", Arrays.asList());
        payload.put("media", Arrays.asList());
        payload.put("schedules", Arrays.asList());
        
        return payload;
    }
}