package com.backend.controller;

import com.backend.entity.ExperienceMedia;
import com.backend.repository.ExperienceMediaRepository;
import com.backend.repository.ExperienceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for ExperienceMediaController.
 * Tests media management operations including CRUD operations and file uploads.
 */
@ExtendWith(MockitoExtension.class)
class ExperienceMediaControllerTest {

    @Mock
    private ExperienceMediaRepository experienceMediaRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @InjectMocks
    private ExperienceMediaController experienceMediaController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(experienceMediaController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testGetAllExperienceMedia_Success() throws Exception {
        // Arrange
        List<ExperienceMedia> mediaList = Arrays.asList(
                createTestMedia(1L, "photo1.jpg"),
                createTestMedia(2L, "photo2.jpg")
        );
        when(experienceMediaRepository.findAll()).thenReturn(mediaList);

        // Act & Assert
        mockMvc.perform(get("/api/experience-media"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(experienceMediaRepository).findAll();
    }

    @Test
    void testGetExperienceMediaById_Success() throws Exception {
        // Arrange
        ExperienceMedia media = createTestMedia(1L, "photo1.jpg");
        when(experienceMediaRepository.findById(1L)).thenReturn(Optional.of(media));

        // Act & Assert
        mockMvc.perform(get("/api/experience-media/1"))
                .andExpect(status().isOk());

        verify(experienceMediaRepository).findById(1L);
    }

    @Test
    void testGetExperienceMediaById_NotFound() throws Exception {
        // Arrange
        when(experienceMediaRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/experience-media/999"))
                .andExpect(status().isOk()); // Returns null but status is OK

        verify(experienceMediaRepository).findById(999L);
    }

    @Test
    void testCreateExperienceMedia_Success() throws Exception {
        // Arrange
        ExperienceMedia media = createTestMedia(null, "new-photo.jpg");
        ExperienceMedia savedMedia = createTestMedia(1L, "new-photo.jpg");
        when(experienceMediaRepository.save(any(ExperienceMedia.class))).thenReturn(savedMedia);

        // Act & Assert
        mockMvc.perform(post("/api/experience-media")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(media)))
                .andExpect(status().isOk());

        verify(experienceMediaRepository).save(any(ExperienceMedia.class));
    }

    @Test
    void testUpdateExperienceMedia_Success() throws Exception {
        // Arrange
        ExperienceMedia media = createTestMedia(1L, "updated-photo.jpg");
        when(experienceMediaRepository.save(any(ExperienceMedia.class))).thenReturn(media);

        // Act & Assert
        mockMvc.perform(put("/api/experience-media/1")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(media)))
                .andExpect(status().isOk());

        verify(experienceMediaRepository).save(any(ExperienceMedia.class));
    }

    @Test
    void testDeleteExperienceMedia_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/experience-media/1"))
                .andExpect(status().isOk());

        verify(experienceMediaRepository).deleteById(1L);
    }

    @Test
    void testUploadMedia_EmptyFile() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]);

        // Act & Assert
        mockMvc.perform(multipart("/api/experience-media/upload")
                .file(emptyFile)
                .param("experienceId", "1")
                .param("mediaType", "PHOTO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No file selected"));

        verify(experienceMediaRepository, never()).save(any(ExperienceMedia.class));
    }

    @Test
    void testUploadMedia_InvalidFileType() throws Exception {
        // Arrange
        MockMultipartFile textFile = new MockMultipartFile("file", "test.txt", "text/plain", "test content".getBytes());

        // Act & Assert
        mockMvc.perform(multipart("/api/experience-media/upload")
                .file(textFile)
                .param("experienceId", "1")
                .param("mediaType", "PHOTO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only image files are allowed"));

        verify(experienceMediaRepository, never()).save(any(ExperienceMedia.class));
    }

    @Test
    void testUploadMedia_ExperienceNotFound() throws Exception {
        // Arrange
        MockMultipartFile imageFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", "image content".getBytes());
        when(experienceRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(multipart("/api/experience-media/upload")
                .file(imageFile)
                .param("experienceId", "999")
                .param("mediaType", "PHOTO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Experience not found"));

        verify(experienceRepository).findById(999L);
        verify(experienceMediaRepository, never()).save(any(ExperienceMedia.class));
    }

    @Test
    void testGetMediaFile_NotFound() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/experience-media/files/nonexistent.jpg"))
                .andExpect(status().isNotFound());
    }

    // Helper methods for creating test objects
    private ExperienceMedia createTestMedia(Long id, String filename) {
        ExperienceMedia media = new ExperienceMedia();
        media.setMediaId(id);
        media.setMediaUrl("/api/experience-media/files/" + filename);
        media.setCaption("Test caption");
        media.setDisplayOrder(1);
        media.setCreatedAt(LocalDateTime.now());
        return media;
    }
}