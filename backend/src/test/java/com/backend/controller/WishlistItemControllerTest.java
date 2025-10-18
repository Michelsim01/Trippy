package com.backend.controller;

import com.backend.entity.WishlistItem;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceCategory;
import com.backend.entity.ExperienceStatus;
import com.backend.repository.WishlistItemRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class WishlistItemControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private WishlistItemRepository wishlistItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @InjectMocks
    private WishlistItemController wishlistItemController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(wishlistItemController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    private User createSampleUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        return user;
    }

    private Experience createSampleExperience() {
        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setTitle("City Tour");
        experience.setShortDescription("Amazing city experience");
        experience.setCoverPhotoUrl("http://example.com/photo.jpg");
        experience.setPrice(BigDecimal.valueOf(100.00));
        experience.setDuration(BigDecimal.valueOf(3.0));
        experience.setLocation("Singapore");
        experience.setCategory(ExperienceCategory.ADVENTURE);
        experience.setStatus(ExperienceStatus.ACTIVE);
        experience.setAverageRating(BigDecimal.valueOf(4.5));
        experience.setTotalReviews(10);
        experience.setParticipantsAllowed(8);
        return experience;
    }

    private WishlistItem createSampleWishlistItem() {
        WishlistItem item = new WishlistItem();
        item.setWishlistItemId(1L);
        item.setUser(createSampleUser());
        item.setExperience(createSampleExperience());
        item.setAddedAt(LocalDateTime.now());
        return item;
    }

    @Test
    void getByUser_Success() throws Exception {
        User user = createSampleUser();
        List<WishlistItem> wishlistItems = Arrays.asList(createSampleWishlistItem());
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(wishlistItemRepository.findByUser_Id(1L)).thenReturn(wishlistItems);

        mockMvc.perform(get("/api/wishlist-items/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].wishlistItemId").value(1L))
                .andExpect(jsonPath("$[0].userId").value(1L))
                .andExpect(jsonPath("$[0].experience.experienceId").value(1L))
                .andExpect(jsonPath("$[0].experience.title").value("City Tour"));

        verify(userRepository).findById(1L);
        verify(wishlistItemRepository).findByUser_Id(1L);
    }

    @Test
    void getByUser_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/wishlist-items/user/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("User not found"));

        verify(userRepository).findById(1L);
        verify(wishlistItemRepository, never()).findByUser_Id(any());
    }

    @Test
    void getByUser_ServiceException() throws Exception {
        when(userRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/wishlist-items/user/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Error fetching wishlist items: Database error"));

        verify(userRepository).findById(1L);
    }

    @Test
    void getAllWishlistItems_Success() throws Exception {
        List<WishlistItem> wishlistItems = Arrays.asList(createSampleWishlistItem());
        when(wishlistItemRepository.findAll()).thenReturn(wishlistItems);

        mockMvc.perform(get("/api/wishlist-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].wishlistItemId").value(1L));

        verify(wishlistItemRepository).findAll();
    }

    @Test
    void getWishlistItemById_Success() throws Exception {
        WishlistItem item = createSampleWishlistItem();
        when(wishlistItemRepository.findById(1L)).thenReturn(Optional.of(item));

        mockMvc.perform(get("/api/wishlist-items/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wishlistItemId").value(1L));

        verify(wishlistItemRepository).findById(1L);
    }

    @Test
    void getWishlistItemById_NotFound() throws Exception {
        when(wishlistItemRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/wishlist-items/1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Wishlist item not found"));

        verify(wishlistItemRepository).findById(1L);
    }

    @Test
    void getWishlistItemById_ServiceException() throws Exception {
        when(wishlistItemRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/wishlist-items/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Error fetching wishlist item: Database error"));

        verify(wishlistItemRepository).findById(1L);
    }

    @Test
    void createWishlistItem_Success() throws Exception {
        WishlistItem item = createSampleWishlistItem();
        when(wishlistItemRepository.save(any(WishlistItem.class))).thenReturn(item);

        mockMvc.perform(post("/api/wishlist-items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(item)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wishlistItemId").value(1L));

        verify(wishlistItemRepository).save(any(WishlistItem.class));
    }

    @Test
    void addToWishlist_Success() throws Exception {
        User user = createSampleUser();
        Experience experience = createSampleExperience();
        WishlistItem savedItem = createSampleWishlistItem();
        
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(experienceRepository.findById(1L)).thenReturn(Optional.of(experience));
        when(wishlistItemRepository.save(any(WishlistItem.class))).thenReturn(savedItem);

        mockMvc.perform(post("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Item added to wishlist successfully"))
                .andExpect(jsonPath("$.wishlistItemId").value(1L))
                .andExpect(jsonPath("$.userId").value(1L))
                .andExpect(jsonPath("$.experienceId").value(1L));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
        verify(userRepository).findById(1L);
        verify(experienceRepository).findById(1L);
        verify(wishlistItemRepository).save(any(WishlistItem.class));
    }

    @Test
    void addToWishlist_AlreadyExists() throws Exception {
        WishlistItem existingItem = createSampleWishlistItem();
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenReturn(Optional.of(existingItem));

        mockMvc.perform(post("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Item already in wishlist"))
                .andExpect(jsonPath("$.wishlistItemId").value(1L));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
        verify(userRepository, never()).findById(any());
        verify(experienceRepository, never()).findById(any());
        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void addToWishlist_UserNotFound() throws Exception {
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        when(experienceRepository.findById(1L)).thenReturn(Optional.of(createSampleExperience()));

        mockMvc.perform(post("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("User or Experience not found"));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
        verify(userRepository).findById(1L);
        verify(experienceRepository).findById(1L);
        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void addToWishlist_ExperienceNotFound() throws Exception {
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(createSampleUser()));
        when(experienceRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("User or Experience not found"));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
        verify(userRepository).findById(1L);
        verify(experienceRepository).findById(1L);
        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void addToWishlist_ServiceException() throws Exception {
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(post("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Error adding to wishlist: Database error"));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
    }

    @Test
    void updateWishlistItem_Success() throws Exception {
        WishlistItem item = createSampleWishlistItem();
        when(wishlistItemRepository.save(any(WishlistItem.class))).thenReturn(item);

        mockMvc.perform(put("/api/wishlist-items/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(item)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wishlistItemId").value(1L));

        verify(wishlistItemRepository).save(any(WishlistItem.class));
    }

    @Test
    void deleteWishlistItem_Success() throws Exception {
        doNothing().when(wishlistItemRepository).deleteById(1L);

        mockMvc.perform(delete("/api/wishlist-items/1"))
                .andExpect(status().isOk());

        verify(wishlistItemRepository).deleteById(1L);
    }

    @Test
    void deleteByUserAndExperience_Success() throws Exception {
        WishlistItem item = createSampleWishlistItem();
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenReturn(Optional.of(item));
        doNothing().when(wishlistItemRepository).delete(item);

        mockMvc.perform(delete("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Wishlist item removed successfully"));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
        verify(wishlistItemRepository).delete(item);
    }

    @Test
    void deleteByUserAndExperience_NotFound() throws Exception {
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isNotFound());

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
        verify(wishlistItemRepository, never()).delete(any());
    }

    @Test
    void deleteByUserAndExperience_ServiceException() throws Exception {
        when(wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(1L, 1L))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(delete("/api/wishlist-items/user/1/experience/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Error removing wishlist item: Database error"));

        verify(wishlistItemRepository).findByUser_IdAndExperience_ExperienceId(1L, 1L);
    }
}