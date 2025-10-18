package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
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
class TripChatServiceTest {

    @Mock(lenient = true)
    private PersonalChatRepository personalChatRepository;

    @Mock(lenient = true)
    private TripCohortRepository tripCohortRepository;

    @Mock(lenient = true)
    private ChatMemberRepository chatMemberRepository;

    @Mock(lenient = true)
    private CohortMemberRepository cohortMemberRepository;

    @Mock(lenient = true)
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Mock(lenient = true)
    private UserRepository userRepository;

    @Mock(lenient = true)
    private BookingRepository bookingRepository;

    @Mock(lenient = true)
    private ChatUnreadCountRepository chatUnreadCountRepository;

    @InjectMocks
    private TripChatService tripChatService;

    private ExperienceSchedule testSchedule;
    private User testUser;
    private Booking testBooking;
    private Experience testExperience;
    private TripCohort testCohort;
    private PersonalChat testTripChat;

    @BeforeEach
    void setUp() {
        testExperience = createTestExperience(1L, "City Tour");
        testSchedule = createTestSchedule(1L, testExperience);
        testUser = createTestUser(1L, "test@example.com");
        testBooking = createTestBooking(1L, testUser, testSchedule);
        testCohort = createTestCohort(1L, testSchedule);
        testTripChat = createTestTripChat(1L, testCohort, testExperience);
    }

    @Test
    void testGetOrCreateTripChat_ExistingCohortAndChat_ReturnsExistingChat() {
        // Arrange
        Long scheduleId = 1L;
        testSchedule.setTripCohort(testCohort);
        testCohort.setPersonalChat(testTripChat);
        
        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

        // Act
        PersonalChat result = tripChatService.getOrCreateTripChat(scheduleId);

        // Assert
        assertNotNull(result);
        assertEquals(testTripChat, result);
        verify(experienceScheduleRepository).findById(scheduleId);
        verify(tripCohortRepository, never()).save(any());
        verify(personalChatRepository, never()).save(any());
    }

    @Test
    void testGetOrCreateTripChat_NoExistingCohort_CreatesNewCohortAndChat() {
        // Arrange
        Long scheduleId = 1L;
        testSchedule.setTripCohort(null); // No existing cohort
        
        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
        when(tripCohortRepository.save(any(TripCohort.class))).thenReturn(testCohort);
        when(personalChatRepository.save(any(PersonalChat.class))).thenReturn(testTripChat);
        when(experienceScheduleRepository.save(any(ExperienceSchedule.class))).thenReturn(testSchedule);

        // Act
        PersonalChat result = tripChatService.getOrCreateTripChat(scheduleId);

        // Assert
        assertNotNull(result);
        verify(experienceScheduleRepository).findById(scheduleId);
        verify(tripCohortRepository, atLeastOnce()).save(any(TripCohort.class));
        verify(personalChatRepository).save(any(PersonalChat.class));
    }

    @Test
    void testGetOrCreateTripChat_InvalidScheduleId_ThrowsException() {
        // Arrange
        Long invalidScheduleId = 999L;
        when(experienceScheduleRepository.findById(invalidScheduleId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> tripChatService.getOrCreateTripChat(invalidScheduleId));
        assertEquals("Experience schedule not found", exception.getMessage());
        verify(experienceScheduleRepository).findById(invalidScheduleId);
    }

    @Test
    void testAddUserToTripChat_NewUser_AddsUserToCohortAndChat() {
        // Arrange
        Long scheduleId = 1L;
        Long userId = 1L;
        Long bookingId = 1L;
        
        testSchedule.setTripCohort(testCohort);
        testCohort.setPersonalChat(testTripChat);
        
        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(chatMemberRepository.findByPersonalChatAndUser(testTripChat, testUser)).thenReturn(Optional.empty());
        when(cohortMemberRepository.save(any(CohortMember.class))).thenReturn(new CohortMember());
        when(chatMemberRepository.save(any(ChatMember.class))).thenReturn(new ChatMember());

        // Act
        PersonalChat result = tripChatService.addUserToTripChat(scheduleId, userId, bookingId);

        // Assert
        assertNotNull(result);
        assertEquals(testTripChat, result);
        verify(cohortMemberRepository).save(any(CohortMember.class));
        verify(chatMemberRepository).save(any(ChatMember.class));
    }

    @Test
    void testAddUserToTripChat_ExistingUser_ReturnsExistingChat() {
        // Arrange
        Long scheduleId = 1L;
        Long userId = 1L;
        Long bookingId = 1L;
        
        testSchedule.setTripCohort(testCohort);
        testCohort.setPersonalChat(testTripChat);
        ChatMember existingMember = new ChatMember();
        
        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(chatMemberRepository.findByPersonalChatAndUser(testTripChat, testUser)).thenReturn(Optional.of(existingMember));

        // Act
        PersonalChat result = tripChatService.addUserToTripChat(scheduleId, userId, bookingId);

        // Assert
        assertNotNull(result);
        assertEquals(testTripChat, result);
        verify(cohortMemberRepository, never()).save(any());
        verify(chatMemberRepository, never()).save(any());
    }

    @Test
    void testAddGuideToTripChat_NewGuide_AddsGuideWithAdminRole() {
        // Arrange
        Long scheduleId = 1L;
        Long guideId = 2L;
        User guide = createTestUser(guideId, "guide@example.com");
        
        testSchedule.setTripCohort(testCohort);
        testCohort.setPersonalChat(testTripChat);
        
        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
        when(userRepository.findById(guideId)).thenReturn(Optional.of(guide));
        when(chatMemberRepository.findByPersonalChatAndUser(testTripChat, guide)).thenReturn(Optional.empty());
        when(chatMemberRepository.save(any(ChatMember.class))).thenReturn(new ChatMember());

        // Act
        PersonalChat result = tripChatService.addGuideToTripChat(scheduleId, guideId);

        // Assert
        assertNotNull(result);
        assertEquals(testTripChat, result);
        verify(chatMemberRepository).save(any(ChatMember.class));
    }

    @Test
    void testRemoveUserFromTripChat_ValidBooking_RemovesUserFromCohortAndChat() {
        // Arrange
        Long bookingId = 1L;
        CohortMember cohortMember = new CohortMember();
        cohortMember.setTripCohort(testCohort);
        cohortMember.setUser(testUser);
        testCohort.setPersonalChat(testTripChat);
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(cohortMemberRepository.findByBooking(testBooking)).thenReturn(Arrays.asList(cohortMember));
        when(chatMemberRepository.findByPersonalChatAndUser(testTripChat, testUser))
            .thenReturn(Optional.of(new ChatMember()));

        // Act
        tripChatService.removeUserFromTripChat(bookingId);

        // Assert
        verify(cohortMemberRepository).delete(cohortMember);
        verify(chatMemberRepository).delete(any(ChatMember.class));
    }

    @Test
    void testGetUserTripChats_ValidUser_ReturnsUserTripChats() {
        // Arrange
        Long userId = 1L;
        List<PersonalChat> tripChats = Arrays.asList(testTripChat);
        List<Long> chatIds = Arrays.asList(1L);
        
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(personalChatRepository.findTripChatsByUserId(userId)).thenReturn(tripChats);
        when(personalChatRepository.findByIdsWithMembers(chatIds)).thenReturn(tripChats);

        // Act
        List<PersonalChat> result = tripChatService.getUserTripChats(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testTripChat, result.get(0));
        verify(personalChatRepository).findTripChatsByUserId(userId);
    }

    // Helper methods
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }

    private Experience createTestExperience(Long id, String title) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle(title);
        return experience;
    }

    private ExperienceSchedule createTestSchedule(Long id, Experience experience) {
        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(id);
        schedule.setExperience(experience);
        schedule.setStartDateTime(LocalDateTime.now().plusDays(1));
        schedule.setEndDateTime(LocalDateTime.now().plusDays(1).plusHours(3));
        return schedule;
    }

    private Booking createTestBooking(Long id, User traveler, ExperienceSchedule schedule) {
        Booking booking = new Booking();
        booking.setBookingId(id);
        booking.setTraveler(traveler);
        booking.setExperienceSchedule(schedule);
        booking.setStatus(BookingStatus.CONFIRMED);
        return booking;
    }

    private TripCohort createTestCohort(Long id, ExperienceSchedule schedule) {
        TripCohort cohort = new TripCohort();
        cohort.setCohortId(id);
        cohort.setExperienceSchedule(schedule);
        cohort.setName("Test Cohort");
        cohort.setIsActive(true);
        return cohort;
    }

    private PersonalChat createTestTripChat(Long id, TripCohort cohort, Experience experience) {
        PersonalChat chat = new PersonalChat();
        chat.setPersonalChatId(id);
        chat.setTripCohort(cohort);
        chat.setExperience(experience);
        chat.setIsTripChat(true);
        chat.setName("Test Trip Chat");
        return chat;
    }
}