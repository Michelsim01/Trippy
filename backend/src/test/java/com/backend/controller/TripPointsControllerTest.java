package com.backend.controller;

import com.backend.entity.TripPoints;
import com.backend.entity.TripPointsTransaction;
import com.backend.entity.Review;
import com.backend.entity.Experience;
import com.backend.entity.User;
import com.backend.service.TripPointsService;
import com.backend.repository.ReviewRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TripPointsControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private TripPointsService tripPointsService;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private TripPointsController tripPointsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tripPointsController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    private TripPoints createSampleTripPoints() {
        TripPoints tripPoints = new TripPoints();
        tripPoints.setPointsId(1L);
        
        User user = new User();
        user.setId(1L);
        tripPoints.setUser(user);
        
        tripPoints.setTransactionType(TripPointsTransaction.REVIEW);
        tripPoints.setPointsChange(50);
        tripPoints.setPointsBalanceAfter(150);
        tripPoints.setReferenceId(1L);
        tripPoints.setCreatedAt(LocalDateTime.now());
        return tripPoints;
    }

    private Review createSampleReview() {
        Review review = new Review();
        review.setReviewId(1L);
        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setTitle("City Tour");
        experience.setLocation("Singapore");
        review.setExperience(experience);
        return review;
    }

    @Test
    void getAllTripPoints_Success() throws Exception {
        List<TripPoints> tripPointsList = Arrays.asList(createSampleTripPoints());
        when(tripPointsService.getAllTripPoints()).thenReturn(tripPointsList);

        mockMvc.perform(get("/api/trip-points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].pointsId").value(1L));

        verify(tripPointsService).getAllTripPoints();
    }

    @Test
    void getAllTripPoints_ServiceException() throws Exception {
        when(tripPointsService.getAllTripPoints()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/trip-points"))
                .andExpect(status().isInternalServerError());

        verify(tripPointsService).getAllTripPoints();
    }

    @Test
    void getTripPointsById_Success() throws Exception {
        TripPoints tripPoints = createSampleTripPoints();
        when(tripPointsService.getTripPointsById(1L)).thenReturn(Optional.of(tripPoints));

        mockMvc.perform(get("/api/trip-points/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pointsId").value(1L))
                .andExpect(jsonPath("$.pointsChange").value(50));

        verify(tripPointsService).getTripPointsById(1L);
    }

    @Test
    void getTripPointsById_NotFound() throws Exception {
        when(tripPointsService.getTripPointsById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/trip-points/1"))
                .andExpect(status().isNotFound());

        verify(tripPointsService).getTripPointsById(1L);
    }

    @Test
    void getTripPointsById_InvalidId() throws Exception {
        mockMvc.perform(get("/api/trip-points/0"))
                .andExpect(status().isBadRequest());

        verify(tripPointsService, never()).getTripPointsById(any());
    }

    @Test
    void getTripPointsById_ServiceException() throws Exception {
        when(tripPointsService.getTripPointsById(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/trip-points/1"))
                .andExpect(status().isInternalServerError());

        verify(tripPointsService).getTripPointsById(1L);
    }

    @Test
    void getUserPointsBalance_Success() throws Exception {
        when(tripPointsService.getPointsBalance(1L)).thenReturn(150);
        when(tripPointsService.getTotalEarned(1L)).thenReturn(300);
        when(tripPointsService.getTotalRedeemed(1L)).thenReturn(150);

        mockMvc.perform(get("/api/trip-points/user/1/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1L))
                .andExpect(jsonPath("$.pointsBalance").value(150))
                .andExpect(jsonPath("$.totalEarned").value(300))
                .andExpect(jsonPath("$.totalRedeemed").value(150));

        verify(tripPointsService).getPointsBalance(1L);
        verify(tripPointsService).getTotalEarned(1L);
        verify(tripPointsService).getTotalRedeemed(1L);
    }

    @Test
    void getTripPointsHistory_Success() throws Exception {
        TripPoints tripPoints = createSampleTripPoints();
        List<TripPoints> history = Arrays.asList(tripPoints);
        when(tripPointsService.getTripPointsHistory(1L)).thenReturn(history);

        mockMvc.perform(get("/api/trip-points/user/1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].pointsId").value(1L))
                .andExpect(jsonPath("$[0].userId").value(1L))
                .andExpect(jsonPath("$[0].transactionType").value("REVIEW"));

        verify(tripPointsService).getTripPointsHistory(1L);
    }

    @Test
    void getTripPointsHistory_WithReviewEnrichment_Success() throws Exception {
        TripPoints tripPoints = createSampleTripPoints();
        Review review = createSampleReview();
        List<TripPoints> history = Arrays.asList(tripPoints);
        
        when(tripPointsService.getTripPointsHistory(1L)).thenReturn(history);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        mockMvc.perform(get("/api/trip-points/user/1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].experience.experienceId").value(1L))
                .andExpect(jsonPath("$[0].experience.title").value("City Tour"))
                .andExpect(jsonPath("$[0].experience.location").value("Singapore"));

        verify(tripPointsService).getTripPointsHistory(1L);
        verify(reviewRepository).findById(1L);
    }

    @Test
    void awardPointsForReview_Success() throws Exception {
        TripPoints transaction = createSampleTripPoints();
        Map<String, Object> request = Map.of(
            "referenceId", 1L,
            "pointsToAward", 50
        );

        when(tripPointsService.awardPointsForReview(1L, 1L, 50)).thenReturn(transaction);

        mockMvc.perform(post("/api/trip-points/user/1/award-review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Points awarded for review"))
                .andExpect(jsonPath("$.transactionId").value(1L))
                .andExpect(jsonPath("$.pointsEarned").value(50));

        verify(tripPointsService).awardPointsForReview(1L, 1L, 50);
    }

    @Test
    void awardPointsForReview_WithDefaultPoints_Success() throws Exception {
        TripPoints transaction = createSampleTripPoints();
        Map<String, Object> request = Map.of("referenceId", 1L);

        when(tripPointsService.awardPointsForReview(1L, 1L, 50)).thenReturn(transaction);

        mockMvc.perform(post("/api/trip-points/user/1/award-review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tripPointsService).awardPointsForReview(1L, 1L, 50);
    }

    @Test
    void awardPointsForReview_ServiceException() throws Exception {
        Map<String, Object> request = Map.of(
            "referenceId", 1L,
            "pointsToAward", 50
        );

        when(tripPointsService.awardPointsForReview(1L, 1L, 50))
                .thenThrow(new RuntimeException("Points already awarded"));

        mockMvc.perform(post("/api/trip-points/user/1/award-review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Points already awarded"));

        verify(tripPointsService).awardPointsForReview(1L, 1L, 50);
    }

    @Test
    void redeemPoints_Success() throws Exception {
        TripPoints transaction = createSampleTripPoints();
        transaction.setTransactionType(TripPointsTransaction.REDEMPTION);
        transaction.setPointsChange(-100);
        transaction.setPointsBalanceAfter(50);

        Map<String, Object> request = Map.of("pointsToRedeem", 100);

        when(tripPointsService.redeemPoints(1L, 100)).thenReturn(transaction);

        mockMvc.perform(post("/api/trip-points/user/1/redeem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Points redeemed successfully"))
                .andExpect(jsonPath("$.pointsRedeemed").value(100))
                .andExpect(jsonPath("$.newBalance").value(50));

        verify(tripPointsService).redeemPoints(1L, 100);
    }

    @Test
    void redeemPoints_InvalidAmount() throws Exception {
        Map<String, Object> request = Map.of("pointsToRedeem", 0);

        mockMvc.perform(post("/api/trip-points/user/1/redeem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid points amount"));

        verify(tripPointsService, never()).redeemPoints(any(), any());
    }

    @Test
    void redeemPoints_InsufficientBalance() throws Exception {
        Map<String, Object> request = Map.of("pointsToRedeem", 1000);

        when(tripPointsService.redeemPoints(1L, 1000))
                .thenThrow(new IllegalArgumentException("Insufficient points balance"));

        mockMvc.perform(post("/api/trip-points/user/1/redeem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Insufficient points balance"));

        verify(tripPointsService).redeemPoints(1L, 1000);
    }

    @Test
    void createTripPoints_Success() throws Exception {
        TripPoints tripPoints = createSampleTripPoints();
        when(tripPointsService.updateTripPoints(any(TripPoints.class))).thenReturn(tripPoints);

        mockMvc.perform(post("/api/trip-points")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tripPoints)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pointsId").value(1L));

        verify(tripPointsService).updateTripPoints(any(TripPoints.class));
    }

    @Test
    void createTripPoints_NullRequest() throws Exception {
        mockMvc.perform(post("/api/trip-points")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(tripPointsService, never()).updateTripPoints(any());
    }

    @Test
    void updateTripPoints_Success() throws Exception {
        TripPoints tripPoints = createSampleTripPoints();
        when(tripPointsService.updateTripPoints(any(TripPoints.class))).thenReturn(tripPoints);

        mockMvc.perform(put("/api/trip-points/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tripPoints)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pointsId").value(1L));

        verify(tripPointsService).updateTripPoints(any(TripPoints.class));
    }

    @Test
    void updateTripPoints_InvalidId() throws Exception {
        TripPoints tripPoints = createSampleTripPoints();

        mockMvc.perform(put("/api/trip-points/0")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tripPoints)))
                .andExpect(status().isBadRequest());

        verify(tripPointsService, never()).updateTripPoints(any());
    }

    @Test
    void deleteTripPoints_Success() throws Exception {
        doNothing().when(tripPointsService).deleteTripPoints(1L);

        mockMvc.perform(delete("/api/trip-points/1"))
                .andExpect(status().isNoContent());

        verify(tripPointsService).deleteTripPoints(1L);
    }

    @Test
    void deleteTripPoints_InvalidId() throws Exception {
        mockMvc.perform(delete("/api/trip-points/0"))
                .andExpect(status().isBadRequest());

        verify(tripPointsService, never()).deleteTripPoints(any());
    }

    @Test
    void deleteTripPoints_ServiceException() throws Exception {
        doThrow(new RuntimeException("Database error")).when(tripPointsService).deleteTripPoints(1L);

        mockMvc.perform(delete("/api/trip-points/1"))
                .andExpect(status().isInternalServerError());

        verify(tripPointsService).deleteTripPoints(1L);
    }
}