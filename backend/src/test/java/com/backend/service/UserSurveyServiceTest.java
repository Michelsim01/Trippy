package com.backend.service;

import com.backend.dto.UserSurveyDTO;
import com.backend.entity.User;
import com.backend.entity.UserSurvey;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSurveyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSurveyServiceTest {

    @Mock(lenient = true)
    private UserSurveyRepository userSurveyRepository;

    @Mock(lenient = true)
    private UserRepository userRepository;

    @InjectMocks
    private UserSurveyService userSurveyService;

    private User testUser;
    private UserSurvey testUserSurvey;
    private UserSurveyDTO testUserSurveyDTO;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");

        testUserSurvey = new UserSurvey();
        testUserSurvey.setSurveyId(1L);
        testUserSurvey.setUser(testUser);
        testUserSurvey.setIntroduction("I love traveling and exploring new cultures");
        testUserSurvey.setInterests(Arrays.asList("Adventure", "Culture", "Food", "Nature", "Photography"));
        testUserSurvey.setTravelStyle("Adventure");
        testUserSurvey.setExperienceBudget("$500-$1000");
        testUserSurvey.setCompletedAt(LocalDateTime.now());

        testUserSurveyDTO = new UserSurveyDTO();
        testUserSurveyDTO.setSurveyId(1L);
        testUserSurveyDTO.setUserId(1L);
        testUserSurveyDTO.setIntroduction("I love traveling and exploring new cultures");
        testUserSurveyDTO.setInterests(Arrays.asList("Adventure", "Culture", "Food", "Nature", "Photography"));
        testUserSurveyDTO.setTravelStyle("Adventure");
        testUserSurveyDTO.setExperienceBudget("$500-$1000");
        testUserSurveyDTO.setCompletedAt(LocalDateTime.now());
    }

    @Test
    void testCreateUserSurvey_ValidInput_CreatesSurvey() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userSurveyRepository.save(any(UserSurvey.class))).thenReturn(testUserSurvey);

        // Act
        UserSurveyDTO result = userSurveyService.createUserSurvey(testUserSurveyDTO);

        // Assert
        assertNotNull(result);
        assertEquals(testUserSurveyDTO.getSurveyId(), result.getSurveyId());
        assertEquals(testUserSurveyDTO.getIntroduction(), result.getIntroduction());
        assertEquals(testUserSurveyDTO.getTravelStyle(), result.getTravelStyle());
        verify(userSurveyRepository).save(any(UserSurvey.class));
    }

    @Test
    void testGetUserSurveyByUserId_ExistingSurvey_ReturnsSurvey() {
        // Arrange
        Long userId = 1L;
        when(userSurveyRepository.findByUser_Id(userId)).thenReturn(Optional.of(testUserSurvey));

        // Act
        Optional<UserSurveyDTO> result = userSurveyService.getUserSurveyByUserId(userId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUserSurvey.getSurveyId(), result.get().getSurveyId());
        assertEquals(testUserSurvey.getIntroduction(), result.get().getIntroduction());
        verify(userSurveyRepository).findByUser_Id(userId);
    }

    @Test
    void testGetUserSurveyByUserId_NonExistentSurvey_ReturnsEmpty() {
        // Arrange
        Long userId = 999L;
        when(userSurveyRepository.findByUser_Id(userId)).thenReturn(Optional.empty());

        // Act
        Optional<UserSurveyDTO> result = userSurveyService.getUserSurveyByUserId(userId);

        // Assert
        assertFalse(result.isPresent());
        verify(userSurveyRepository).findByUser_Id(userId);
    }

    @Test
    void testGetAllUserSurveys_ReturnsAllSurveys() {
        // Arrange
        UserSurvey survey2 = new UserSurvey();
        survey2.setSurveyId(2L);
        survey2.setUser(testUser);
        survey2.setIntroduction("Another introduction");
        survey2.setTravelStyle("Relaxation");
        
        List<UserSurvey> surveys = Arrays.asList(testUserSurvey, survey2);
        when(userSurveyRepository.findAll()).thenReturn(surveys);

        // Act
        List<UserSurveyDTO> result = userSurveyService.getAllUserSurveys();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(testUserSurvey.getSurveyId(), result.get(0).getSurveyId());
        assertEquals(survey2.getSurveyId(), result.get(1).getSurveyId());
        verify(userSurveyRepository).findAll();
    }

    @Test
    void testUpdateUserSurvey_ValidInput_UpdatesSurvey() {
        // Arrange
        UserSurveyDTO updatedSurveyDTO = new UserSurveyDTO();
        updatedSurveyDTO.setSurveyId(1L);
        updatedSurveyDTO.setUserId(1L);
        updatedSurveyDTO.setIntroduction("Updated introduction");
        updatedSurveyDTO.setTravelStyle("Luxury");
        updatedSurveyDTO.setInterests(Arrays.asList("Luxury", "Culture", "Food", "Shopping", "Spa"));

        UserSurvey updatedSurvey = new UserSurvey();
        updatedSurvey.setSurveyId(1L);
        updatedSurvey.setUser(testUser);
        updatedSurvey.setIntroduction("Updated introduction");
        updatedSurvey.setTravelStyle("Luxury");

        when(userSurveyRepository.existsById(1L)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userSurveyRepository.save(any(UserSurvey.class))).thenReturn(updatedSurvey);

        // Act
        Optional<UserSurveyDTO> result = userSurveyService.updateUserSurvey(1L, updatedSurveyDTO);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(updatedSurveyDTO.getIntroduction(), result.get().getIntroduction());
        assertEquals(updatedSurveyDTO.getTravelStyle(), result.get().getTravelStyle());
        verify(userSurveyRepository).existsById(1L);
        verify(userSurveyRepository).save(any(UserSurvey.class));
    }

    @Test
    void testUpdateUserSurvey_NonExistentSurvey_ReturnsEmpty() {
        // Arrange
        Long surveyId = 999L;
        UserSurveyDTO updatedSurveyDTO = new UserSurveyDTO();
        when(userSurveyRepository.existsById(surveyId)).thenReturn(false);

        // Act
        Optional<UserSurveyDTO> result = userSurveyService.updateUserSurvey(surveyId, updatedSurveyDTO);

        // Assert
        assertFalse(result.isPresent());
        verify(userSurveyRepository).existsById(surveyId);
        verify(userSurveyRepository, never()).save(any(UserSurvey.class));
    }

    @Test
    void testDeleteUserSurvey_ExistingSurvey_DeletesSurvey() {
        // Arrange
        Long surveyId = 1L;
        when(userSurveyRepository.existsById(surveyId)).thenReturn(true);
        doNothing().when(userSurveyRepository).deleteById(surveyId);

        // Act
        boolean result = userSurveyService.deleteUserSurvey(surveyId);

        // Assert
        assertTrue(result);
        verify(userSurveyRepository).existsById(surveyId);
        verify(userSurveyRepository).deleteById(surveyId);
    }

    @Test
    void testDeleteUserSurvey_NonExistentSurvey_ReturnsFalse() {
        // Arrange
        Long surveyId = 999L;
        when(userSurveyRepository.existsById(surveyId)).thenReturn(false);

        // Act
        boolean result = userSurveyService.deleteUserSurvey(surveyId);

        // Assert
        assertFalse(result);
        verify(userSurveyRepository).existsById(surveyId);
        verify(userSurveyRepository, never()).deleteById(surveyId);
    }

    @Test
    void testCheckUserSurveyExists_ExistingSurvey_ReturnsTrue() {
        // Arrange
        Long userId = 1L;
        when(userSurveyRepository.existsByUser_Id(userId)).thenReturn(true);

        // Act
        boolean result = userSurveyService.checkUserSurveyExists(userId);

        // Assert
        assertTrue(result);
        verify(userSurveyRepository).existsByUser_Id(userId);
    }

    @Test
    void testCheckUserSurveyExists_NonExistentSurvey_ReturnsFalse() {
        // Arrange
        Long userId = 999L;
        when(userSurveyRepository.existsByUser_Id(userId)).thenReturn(false);

        // Act
        boolean result = userSurveyService.checkUserSurveyExists(userId);

        // Assert
        assertFalse(result);
        verify(userSurveyRepository).existsByUser_Id(userId);
    }

    @Test
    void testGetUserSurveyById_ExistingSurvey_ReturnsSurvey() {
        // Arrange
        Long surveyId = 1L;
        when(userSurveyRepository.findById(surveyId)).thenReturn(Optional.of(testUserSurvey));

        // Act
        Optional<UserSurveyDTO> result = userSurveyService.getUserSurveyById(surveyId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUserSurvey.getSurveyId(), result.get().getSurveyId());
        assertEquals(testUserSurvey.getIntroduction(), result.get().getIntroduction());
        verify(userSurveyRepository).findById(surveyId);
    }
}