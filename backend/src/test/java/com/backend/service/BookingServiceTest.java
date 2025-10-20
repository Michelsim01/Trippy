package com.backend.service;

import com.backend.dto.request.BookingRequestDTO;
import com.backend.dto.response.BookingResponseDTO;
import com.backend.dto.response.BookingValidationDTO;
import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.ExperienceSchedule;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceStatus;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.TransactionRepository;
import com.backend.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    
    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;
    
    @Mock
    private PaymentService paymentService;
    
    @Mock
    private TransactionRepository transactionRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private TripPointsService tripPointsService;
    
    @Mock
    private TripChatService tripChatService;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void testValidateBooking_ExperienceScheduleNotFound_ReturnsInvalidBooking() {
        // Arrange
        BookingRequestDTO request = new BookingRequestDTO();
        request.setExperienceScheduleId(999L);
        request.setNumberOfParticipants(2);

        when(experienceScheduleRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        BookingValidationDTO result = bookingService.validateBooking(request);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getValidationErrors().contains("Experience schedule not found"));

        verify(experienceScheduleRepository).findById(999L);
    }

    @Test
    void testValidateBooking_InactiveExperience_ReturnsInvalidBooking() {
        // Arrange
        BookingRequestDTO request = new BookingRequestDTO();
        request.setExperienceScheduleId(1L);
        request.setNumberOfParticipants(2);

        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(1L);
        schedule.setStartDateTime(LocalDateTime.now().plusDays(7));
        schedule.setAvailableSpots(10);

        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setStatus(ExperienceStatus.INACTIVE); // Inactive status
        schedule.setExperience(experience);

        when(experienceScheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));

        // Act
        BookingValidationDTO result = bookingService.validateBooking(request);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getValidationErrors().contains("Experience is not active"));

        verify(experienceScheduleRepository).findById(1L);
    }

    @Test
    void testValidateBooking_PastExperience_ReturnsInvalidBooking() {
        // Arrange
        BookingRequestDTO request = new BookingRequestDTO();
        request.setExperienceScheduleId(1L);
        request.setNumberOfParticipants(2);

        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(1L);
        schedule.setStartDateTime(LocalDateTime.now().minusDays(1)); // Past date
        schedule.setAvailableSpots(10);

        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setStatus(ExperienceStatus.ACTIVE);
        schedule.setExperience(experience);

        when(experienceScheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));

        // Act
        BookingValidationDTO result = bookingService.validateBooking(request);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getValidationErrors().contains("Cannot book past experiences"));

        verify(experienceScheduleRepository).findById(1L);
    }

    @Test
    void testGetBookingById_ExistingBooking_ReturnsBookingResponse() {
        // Arrange
        Booking booking = new Booking();
        booking.setBookingId(1L);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmationCode("TRP-12345678");
        booking.setContactEmail("john@example.com");
        booking.setContactFirstName("John");
        booking.setContactLastName("Doe");
        booking.setNumberOfParticipants(2);
        booking.setBaseAmount(new BigDecimal("100.00"));
        booking.setServiceFee(new BigDecimal("10.00"));
        booking.setTotalAmount(new BigDecimal("110.00"));

        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(1L);
        schedule.setStartDateTime(LocalDateTime.now().plusDays(7));
        
        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setTitle("City Walking Tour");
        schedule.setExperience(experience);
        booking.setExperienceSchedule(schedule);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // Act
        BookingResponseDTO result = bookingService.getBookingById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getBookingId());
        assertEquals(BookingStatus.CONFIRMED, result.getStatus());
        assertEquals("TRP-12345678", result.getConfirmationCode());
        assertEquals("john@example.com", result.getContactEmail());
        assertEquals("John", result.getContactFirstName());
        assertEquals("Doe", result.getContactLastName());

        verify(bookingRepository).findById(1L);
    }

    @Test
    void testGetBookingById_BookingNotFound_ThrowsException() {
        // Arrange
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> bookingService.getBookingById(999L));
        assertEquals("Booking not found", exception.getMessage());

        verify(bookingRepository).findById(999L);
    }
}