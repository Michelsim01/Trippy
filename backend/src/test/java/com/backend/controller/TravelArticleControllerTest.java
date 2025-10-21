package com.backend.controller;

import com.backend.entity.TravelArticle;
import com.backend.entity.User;
import com.backend.repository.TravelArticleRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ArticleLikeRepository;
import com.backend.service.ArticleCommentService;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TravelArticleControllerTest {

    @Mock
    private TravelArticleRepository travelArticleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ArticleLikeRepository articleLikeRepository;

    @Mock
    private ArticleCommentService articleCommentService;

    @InjectMocks
    private TravelArticleController travelArticleController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(travelArticleController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getAllTravelArticles_Success() throws Exception {
        // Arrange
        TravelArticle article1 = createTestTravelArticle(1L);
        TravelArticle article2 = createTestTravelArticle(2L);
        List<TravelArticle> articles = Arrays.asList(article1, article2);

        when(travelArticleRepository.findAll()).thenReturn(articles);

        // Act & Assert
        mockMvc.perform(get("/api/travel-articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(travelArticleRepository).findAll();
    }

    @Test
    void getAllTravelArticles_Exception() throws Exception {
        // Arrange
        when(travelArticleRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/travel-articles"))
                .andExpect(status().isInternalServerError());

        verify(travelArticleRepository).findAll();
    }

    @Test
    void getTravelArticleById_Success() throws Exception {
        // Arrange
        Long articleId = 1L;
        TravelArticle article = createTestTravelArticle(articleId);
        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.of(article));

        // Act & Assert
        mockMvc.perform(get("/api/travel-articles/{id}", articleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articleId").value(articleId))
                .andExpect(jsonPath("$.title").value("Test Article"))
                .andExpect(jsonPath("$.content").value("Test content"));

        verify(travelArticleRepository).findById(articleId);
    }

    @Test
    void getTravelArticleById_NotFound() throws Exception {
        // Arrange
        Long articleId = 999L;
        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/travel-articles/{id}", articleId))
                .andExpect(status().isNotFound());

        verify(travelArticleRepository).findById(articleId);
    }

    @Test
    void getTravelArticleById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/travel-articles/{id}", -1L))
                .andExpect(status().isBadRequest());

        verify(travelArticleRepository, never()).findById(any());
    }

    @Test
    void getTravelArticleById_Exception() throws Exception {
        // Arrange
        Long articleId = 1L;
        when(travelArticleRepository.findById(articleId)).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/travel-articles/{id}", articleId))
                .andExpect(status().isInternalServerError());

        verify(travelArticleRepository).findById(articleId);
    }

    @Test
    void createTravelArticle_Success() throws Exception {
        // Arrange
        TravelArticle article = createTestTravelArticle(null);
        TravelArticle savedArticle = createTestTravelArticle(1L);
        User testUser = createTestUser();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(travelArticleRepository.save(any(TravelArticle.class))).thenReturn(savedArticle);

        // Act & Assert
        mockMvc.perform(post("/api/travel-articles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(article)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articleId").value(1L))
                .andExpect(jsonPath("$.title").value("Test Article"));

        verify(userRepository).findById(1L);
        verify(travelArticleRepository).save(any(TravelArticle.class));
    }

    @Test
    void createTravelArticle_NullRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/travel-articles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(travelArticleRepository, never()).save(any());
    }

    @Test
    void createTravelArticle_Exception() throws Exception {
        // Arrange
        TravelArticle article = createTestTravelArticle(null);
        User testUser = createTestUser();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(travelArticleRepository.save(any(TravelArticle.class))).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(post("/api/travel-articles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(article)))
                .andExpect(status().isInternalServerError());

        verify(userRepository).findById(1L);
        verify(travelArticleRepository).save(any(TravelArticle.class));
    }

    @Test
    void updateTravelArticle_Success() throws Exception {
        // Arrange
        Long articleId = 1L;
        TravelArticle article = createTestTravelArticle(articleId);

        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.of(article));
        when(travelArticleRepository.save(any(TravelArticle.class))).thenReturn(article);

        // Act & Assert
        mockMvc.perform(put("/api/travel-articles/{id}", articleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(article))
                .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articleId").value(articleId));

        verify(travelArticleRepository).findById(articleId);
        verify(travelArticleRepository).save(any(TravelArticle.class));
    }

    @Test
    void updateTravelArticle_NotFound() throws Exception {
        // Arrange
        Long articleId = 999L;
        TravelArticle article = createTestTravelArticle(articleId);

        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(put("/api/travel-articles/{id}", articleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(article)))
                .andExpect(status().isNotFound());

        verify(travelArticleRepository).findById(articleId);
        verify(travelArticleRepository, never()).save(any());
    }

    @Test
    void updateTravelArticle_InvalidId() throws Exception {
        // Arrange
        TravelArticle article = createTestTravelArticle(1L);

        // Act & Assert
        mockMvc.perform(put("/api/travel-articles/{id}", -1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(article)))
                .andExpect(status().isBadRequest());

        verify(travelArticleRepository, never()).existsById(any());
        verify(travelArticleRepository, never()).save(any());
    }

    @Test
    void updateTravelArticle_NullRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/travel-articles/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(travelArticleRepository, never()).existsById(any());
        verify(travelArticleRepository, never()).save(any());
    }

    @Test
    void deleteTravelArticle_Success() throws Exception {
        // Arrange
        Long articleId = 1L;
        TravelArticle article = createTestTravelArticle(articleId);
        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.of(article));

        // Act & Assert
        mockMvc.perform(delete("/api/travel-articles/{id}", articleId)
                .param("userId", "1"))
                .andExpect(status().isNoContent());

        verify(travelArticleRepository).findById(articleId);
        verify(travelArticleRepository).deleteById(articleId);
    }

    @Test
    void deleteTravelArticle_NotFound() throws Exception {
        // Arrange
        Long articleId = 999L;
        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(delete("/api/travel-articles/{id}", articleId))
                .andExpect(status().isNotFound());

        verify(travelArticleRepository).findById(articleId);
        verify(travelArticleRepository, never()).deleteById(any());
    }

    @Test
    void deleteTravelArticle_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/travel-articles/{id}", -1L))
                .andExpect(status().isBadRequest());

        verify(travelArticleRepository, never()).existsById(any());
        verify(travelArticleRepository, never()).deleteById(any());
    }

    @Test
    void deleteTravelArticle_Exception() throws Exception {
        // Arrange
        Long articleId = 1L;
        TravelArticle article = createTestTravelArticle(articleId);
        when(travelArticleRepository.findById(articleId)).thenReturn(Optional.of(article));
        doThrow(new RuntimeException("Database error")).when(travelArticleRepository).deleteById(articleId);

        // Act & Assert
        mockMvc.perform(delete("/api/travel-articles/{id}", articleId)
                .param("userId", "1"))
                .andExpect(status().isInternalServerError());

        verify(travelArticleRepository).findById(articleId);
        verify(travelArticleRepository).deleteById(articleId);
    }

    // Helper methods
    private TravelArticle createTestTravelArticle(Long id) {
        TravelArticle article = new TravelArticle();
        article.setArticleId(id);
        article.setTitle("Test Article");
        article.setContent("Test content");
        article.setAuthor(createTestUser());
        article.setSlug("test-article");
        article.setViewsCount(0);
        article.setCreatedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());
        return article;
    }

    private User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }
}