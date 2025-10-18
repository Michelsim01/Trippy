package com.backend.controller;

import com.backend.entity.*;
import com.backend.repository.*;
import com.backend.service.TripPointsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    @Mock
    private ReviewRepository reviewRepository;
    
    @Mock
    private BookingRepository bookingRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ExperienceRepository experienceRepository;
    
    @Mock
    private TripPointsService tripPointsService;
    
    @Mock
    private ReviewLikeRepository reviewLikeRepository;

    @InjectMocks
    private ReviewController reviewController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getAllReviews_Success() throws Exception {
        // Arrange
        Review review1 = createTestReview(1L);
        Review review2 = createTestReview(2L);
        List<Review> reviews = Arrays.asList(review1, review2);

        when(reviewRepository.findAll()).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(reviewRepository).findAll();
    }

    @Test
    void getAllReviews_Exception() throws Exception {
        // Arrange
        when(reviewRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/reviews"))
                .andExpect(status().isInternalServerError());

        verify(reviewRepository).findAll();
    }

    @Test
    void getReviewById_Success() throws Exception {
        // Arrange
        Long reviewId = 1L;
        Review review = createTestReview(reviewId);
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

        // Act & Assert
        mockMvc.perform(get("/api/reviews/{id}", reviewId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewId").value(reviewId));

        verify(reviewRepository).findById(reviewId);
    }

    @Test
    void getReviewById_NotFound() throws Exception {
        // Arrange
        Long reviewId = 999L;
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/reviews/{id}", reviewId))
                .andExpect(status().isNotFound());

        verify(reviewRepository).findById(reviewId);
    }

    @Test
    void getReviewById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/reviews/{id}", -1L))
                .andExpect(status().isBadRequest());

        verify(reviewRepository, never()).findById(any());
    }

    @Test
    void getUserReviews_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        List<Review> reviews = Arrays.asList(createTestReview(1L));
        when(reviewRepository.findByReviewer_Id(userId)).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(reviewRepository).findByReviewer_Id(userId);
    }

    @Test
    void getUserReviews_InvalidUserId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/reviews/user/{userId}", -1L))
                .andExpect(status().isBadRequest());

        verify(reviewRepository, never()).findByReviewer_Id(any());
    }

    @Test
    void getReviewsByExperience_Success() throws Exception {
        // Arrange
        Long experienceId = 1L;
        List<Review> reviews = Arrays.asList(createTestReview(1L));
        when(reviewRepository.findByExperience_ExperienceId(experienceId)).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/experience/{experienceId}", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(reviewRepository).findByExperience_ExperienceId(experienceId);
    }

    @Test
    void getReceivedReviews_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        List<Experience> userExperiences = Arrays.asList(createTestExperience(1L));
        List<Review> reviews = Arrays.asList(createTestReview(1L));

        when(experienceRepository.findByGuide_Id(userId)).thenReturn(userExperiences);
        when(reviewRepository.findByExperience_ExperienceIdIn(any())).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/user/{userId}/received", userId)
                .param("sortBy", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(experienceRepository).findByGuide_Id(userId);
        verify(reviewRepository).findByExperience_ExperienceIdIn(any());
    }

    @Test
    void getReceivedReviews_NoExperiences() throws Exception {
        // Arrange
        Long userId = 1L;
        when(experienceRepository.findByGuide_Id(userId)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/reviews/user/{userId}/received", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(experienceRepository).findByGuide_Id(userId);
        verify(reviewRepository, never()).findByExperience_ExperienceIdIn(any());
    }

    @Test
    void getPendingReviews_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        Booking completedBooking = createTestBooking(1L, BookingStatus.COMPLETED);
        List<Booking> bookings = Arrays.asList(completedBooking);

        when(bookingRepository.findByTraveler_Id(userId)).thenReturn(bookings);
        when(reviewRepository.existsByBooking_BookingId(1L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/user/{userId}/pending", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(bookingRepository).findByTraveler_Id(userId);
        verify(reviewRepository).existsByBooking_BookingId(1L);
    }

    @Test
    void getReviewStats_Success() throws Exception {
        // Arrange
        Long experienceId = 1L;
        List<Review> reviews = Arrays.asList(
                createTestReviewWithRating(1L, 5),
                createTestReviewWithRating(2L, 4),
                createTestReviewWithRating(3L, 5)
        );

        when(reviewRepository.findByExperience_ExperienceId(experienceId)).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/experience/{experienceId}/stats", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReviews").value(3))
                .andExpect(jsonPath("$.averageRating").value(4.7));

        verify(reviewRepository).findByExperience_ExperienceId(experienceId);
    }

    @Test
    void getReviewStats_NoReviews() throws Exception {
        // Arrange
        Long experienceId = 1L;
        when(reviewRepository.findByExperience_ExperienceId(experienceId)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/reviews/experience/{experienceId}/stats", experienceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReviews").value(0))
                .andExpect(jsonPath("$.averageRating").value(0.0));

        verify(reviewRepository).findByExperience_ExperienceId(experienceId);
    }

    @Test
    void createReview_Success() throws Exception {
        // Arrange
        Map<String, Object> reviewData = new HashMap<>();
        reviewData.put("bookingId", 1L);
        reviewData.put("reviewerId", 1L);
        reviewData.put("rating", 5);
        reviewData.put("comment", "Great experience!");

        Booking booking = createTestBooking(1L, BookingStatus.COMPLETED);
        Experience experience = createTestExperience(1L);
        User reviewer = createTestUser(1L);
        User guide = createTestUser(2L);
        Review savedReview = createTestReview(1L);
        
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
        when(reviewRepository.existsByBooking_BookingId(1L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(experienceRepository.save(any(Experience.class))).thenReturn(experience);
        when(userRepository.save(any(User.class))).thenReturn(guide);

        // Act & Assert
        mockMvc.perform(post("/api/reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reviewData)))
                .andExpect(status().isCreated());

        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void uploadReviewPhotos_Success() throws Exception {
        // Arrange
        Long reviewId = 1L;
        Review review = createTestReview(reviewId);
        MockMultipartFile photo = new MockMultipartFile("photos", "test.jpg", "image/jpeg", "test content".getBytes());

        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        // Act & Assert
        mockMvc.perform(multipart("/api/reviews/{reviewId}/photos", reviewId)
                .file(photo))
                .andExpect(status().isOk());

        verify(reviewRepository).save(any(Review.class));
    }

    // Helper methods
    private Review createTestReview(Long id) {
        Review review = new Review();
        review.setReviewId(id);
        review.setRating(5);
        review.setComment("Great experience!");
        review.setCreatedAt(LocalDateTime.now());
        review.setReviewer(createTestUser(1L));
        review.setExperience(createTestExperience(1L));
        review.setBooking(createTestBooking(1L, BookingStatus.COMPLETED));
        return review;
    }

    private Review createTestReviewWithRating(Long id, int rating) {
        Review review = createTestReview(id);
        review.setRating(rating);
        return review;
    }

    private Experience createTestExperience(Long id) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle("Test Experience");
        experience.setTotalStars(BigDecimal.ZERO);
        experience.setTotalReviews(0);
        experience.setAverageRating(BigDecimal.ZERO);
        experience.setGuide(createTestUser(2L));
        return experience;
    }

    private User createTestUser(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("test" + id + "@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setAverageRating(BigDecimal.valueOf(4.5));
        return user;
    }

    private Booking createTestBooking(Long id, BookingStatus status) {
        Booking booking = new Booking();
        booking.setBookingId(id);
        booking.setStatus(status);
        booking.setTraveler(createTestUser(1L));
        booking.setTotalAmount(BigDecimal.valueOf(100.0));
        
        // Create and set experienceSchedule relationship
        ExperienceSchedule experienceSchedule = new ExperienceSchedule();
        experienceSchedule.setScheduleId(1L);
        experienceSchedule.setExperience(createTestExperience(1L));
        booking.setExperienceSchedule(experienceSchedule);
        
        return booking;
    }
}