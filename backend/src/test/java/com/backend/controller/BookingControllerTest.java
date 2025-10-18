package com.backend.controller;

import com.backend.dto.*;
import com.backend.dto.request.BookingRequestDTO;
import com.backend.dto.response.BookingResponseDTO;
import com.backend.dto.response.BookingValidationDTO;
import com.backend.entity.*;
import com.backend.repository.*;
import com.backend.service.BookingService;
import com.backend.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for BookingController.
 * Tests controller logic in isolation with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    @Mock
    private PaymentService paymentService;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingController bookingController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bookingController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testValidateBooking_Success() throws Exception {
        // Arrange
        BookingRequestDTO bookingRequest = createTestBookingRequest();
        BookingValidationDTO validationResult = new BookingValidationDTO();
        validationResult.setValid(true);
        validationResult.setMessage("Booking validation successful");

        when(bookingService.validateBooking(any(BookingRequestDTO.class))).thenReturn(validationResult);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.message").value("Booking validation successful"));

        verify(bookingService).validateBooking(any(BookingRequestDTO.class));
    }

    @Test
    void testValidateBooking_Invalid() throws Exception {
        // Arrange
        BookingRequestDTO bookingRequest = createTestBookingRequest();
        BookingValidationDTO validationResult = new BookingValidationDTO();
        validationResult.setValid(false);
        validationResult.setMessage("Insufficient availability");

        when(bookingService.validateBooking(any(BookingRequestDTO.class))).thenReturn(validationResult);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.message").value("Insufficient availability"));

        verify(bookingService).validateBooking(any(BookingRequestDTO.class));
    }

    @Test
    void testCreateBooking_Success() throws Exception {
        // Arrange
        BookingRequestDTO bookingRequest = createTestBookingRequest();
        BookingResponseDTO bookingResponse = createTestBookingResponse();

        when(bookingService.createBooking(any(BookingRequestDTO.class))).thenReturn(bookingResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId").value(1))
                .andExpect(jsonPath("$.confirmationCode").value("TRP-12345678"));

        verify(bookingService).createBooking(any(BookingRequestDTO.class));
    }

    @Test
    void testCreateBooking_InvalidArgument() throws Exception {
        // Arrange
        BookingRequestDTO bookingRequest = createTestBookingRequest();

        when(bookingService.createBooking(any(BookingRequestDTO.class)))
                .thenThrow(new IllegalArgumentException("Invalid booking parameters"));

        // Act & Assert
        mockMvc.perform(post("/api/bookings/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isBadRequest());

        verify(bookingService).createBooking(any(BookingRequestDTO.class));
    }

    @Test
    void testGetBookingById_Success() throws Exception {
        // Arrange
        BookingResponseDTO bookingResponse = createTestBookingResponse();

        when(bookingService.getBookingById(1L)).thenReturn(bookingResponse);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(1))
                .andExpect(jsonPath("$.confirmationCode").value("TRP-12345678"));

        verify(bookingService).getBookingById(1L);
    }

    @Test
    void testGetBookingById_NotFound() throws Exception {
        // Arrange
        when(bookingService.getBookingById(999L))
                .thenThrow(new IllegalArgumentException("Booking not found"));

        // Act & Assert
        mockMvc.perform(get("/api/bookings/999"))
                .andExpect(status().isNotFound());

        verify(bookingService).getBookingById(999L);
    }

    @Test
    void testGetBookingByConfirmationCode_Success() throws Exception {
        // Arrange
        BookingResponseDTO bookingResponse = createTestBookingResponse();

        when(bookingService.getBookingByConfirmationCode("TRP-12345678")).thenReturn(bookingResponse);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/confirmation/TRP-12345678"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(1))
                .andExpect(jsonPath("$.confirmationCode").value("TRP-12345678"));

        verify(bookingService).getBookingByConfirmationCode("TRP-12345678");
    }

    @Test
    void testGetUserBookings_Success() throws Exception {
        // Act & Assert - Simple endpoint test
        mockMvc.perform(get("/api/bookings/user/user@example.com"))
                .andExpect(status().isOk());
    }

    @Test
    void testCalculatePricing_Success() throws Exception {
        // Arrange
        BookingPricingDTO pricingResponse = new BookingPricingDTO();
        pricingResponse.setBaseAmount(new BigDecimal("100.00"));
        pricingResponse.setServiceFee(new BigDecimal("10.00"));
        pricingResponse.setTotalAmount(new BigDecimal("110.00"));

        when(bookingService.calculatePricing(1L, 2)).thenReturn(pricingResponse);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/calculate-pricing")
                .param("experienceScheduleId", "1")
                .param("numberOfParticipants", "2"))
                .andExpect(status().isOk());

        verify(bookingService).calculatePricing(1L, 2);
    }

    @Test
    void testCancelBooking_Success() throws Exception {
        // Arrange
        BookingResponseDTO bookingResponse = createTestBookingResponse();
        bookingResponse.setStatus(BookingStatus.CANCELLED);

        when(bookingService.cancelBooking(1L, "Customer request")).thenReturn(bookingResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/1/cancel")
                .param("reason", "Customer request"))
                .andExpect(status().isOk());

        verify(bookingService).cancelBooking(1L, "Customer request");
    }

    @Test
    void testCalculateServiceFee_Success() throws Exception {
        // Arrange
        BigDecimal baseAmount = new BigDecimal("100.00");
        BigDecimal serviceFee = new BigDecimal("10.00");

        when(paymentService.calculateServiceFee(baseAmount)).thenReturn(serviceFee);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/calculate-fee")
                .param("baseAmount", "100.00"))
                .andExpect(status().isOk());

        verify(paymentService).calculateServiceFee(baseAmount);
    }

    // Helper methods for creating test objects
    private BookingRequestDTO createTestBookingRequest() {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setExperienceScheduleId(1L);
        request.setNumberOfParticipants(2);
        request.setContactFirstName("John");
        request.setContactLastName("Doe");
        request.setContactEmail("john.doe@example.com");
        request.setContactPhone("+1234567890");
        request.setBaseAmount(new BigDecimal("100.00"));
        request.setServiceFee(new BigDecimal("10.00"));
        request.setTotalAmount(new BigDecimal("110.00"));
        request.setTrippointsDiscount(new BigDecimal("0.00"));
        return request;
    }

    private BookingResponseDTO createTestBookingResponse() {
        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(1L);
        response.setConfirmationCode("TRP-12345678");
        response.setStatus(BookingStatus.PENDING);
        response.setTotalAmount(new BigDecimal("110.00"));
        return response;
    }
}