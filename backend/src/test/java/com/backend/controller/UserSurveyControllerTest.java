package com.backend.controller;

import com.backend.dto.UserSurveyDTO;
import com.backend.service.UserSurveyService;
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
class UserSurveyControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private UserSurveyService userSurveyService;

    @InjectMocks
    private UserSurveyController userSurveyController;

        @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(userSurveyController).build();
    }

    private UserSurveyDTO createSampleUserSurveyDTO() {
        UserSurveyDTO dto = new UserSurveyDTO();
        dto.setSurveyId(1L);
        dto.setUserId(1L);
        dto.setIntroduction("Hello, I'm John and I love traveling!");
        dto.setInterests(Arrays.asList("Adventure", "Culture", "Food", "Nature", "History"));
        dto.setTravelStyle("Backpacker");
        dto.setExperienceBudget("Medium");
        dto.setCompletedAt(LocalDateTime.now());
        return dto;
    }

    @Test
    void getAllUserSurveys_Success() throws Exception {
        List<UserSurveyDTO> surveys = Arrays.asList(createSampleUserSurveyDTO());
        when(userSurveyService.getAllUserSurveys()).thenReturn(surveys);

        mockMvc.perform(get("/api/user-surveys"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].surveyId").value(1L))
                .andExpect(jsonPath("$[0].userId").value(1L));

        verify(userSurveyService).getAllUserSurveys();
    }

    @Test
    void getAllUserSurveys_ServiceException() throws Exception {
        when(userSurveyService.getAllUserSurveys()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/user-surveys"))
                .andExpect(status().isInternalServerError());

        verify(userSurveyService).getAllUserSurveys();
    }

    @Test
    void getUserSurveyById_Success() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        when(userSurveyService.getUserSurveyById(1L)).thenReturn(Optional.of(survey));

        mockMvc.perform(get("/api/user-surveys/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.surveyId").value(1L))
                .andExpect(jsonPath("$.introduction").value("Hello, I'm John and I love traveling!"));

        verify(userSurveyService).getUserSurveyById(1L);
    }

    @Test
    void getUserSurveyById_NotFound() throws Exception {
        when(userSurveyService.getUserSurveyById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/user-surveys/1"))
                .andExpect(status().isNotFound());

        verify(userSurveyService).getUserSurveyById(1L);
    }

    @Test
    void getUserSurveyById_InvalidId() throws Exception {
        mockMvc.perform(get("/api/user-surveys/0"))
                .andExpect(status().isBadRequest());

        verify(userSurveyService, never()).getUserSurveyById(any());
    }

    @Test
    void getUserSurveyById_ServiceException() throws Exception {
        when(userSurveyService.getUserSurveyById(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/user-surveys/1"))
                .andExpect(status().isInternalServerError());

        verify(userSurveyService).getUserSurveyById(1L);
    }

    @Test
    void getUserSurveyByUserId_Success() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        when(userSurveyService.getUserSurveyByUserId(1L)).thenReturn(Optional.of(survey));

        mockMvc.perform(get("/api/user-surveys/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1L))
                .andExpect(jsonPath("$.travelStyle").value("Backpacker"));

        verify(userSurveyService).getUserSurveyByUserId(1L);
    }

    @Test
    void getUserSurveyByUserId_NotFound() throws Exception {
        when(userSurveyService.getUserSurveyByUserId(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/user-surveys/user/1"))
                .andExpect(status().isNotFound());

        verify(userSurveyService).getUserSurveyByUserId(1L);
    }

    @Test
    void getUserSurveyByUserId_InvalidId() throws Exception {
        mockMvc.perform(get("/api/user-surveys/user/0"))
                .andExpect(status().isBadRequest());

        verify(userSurveyService, never()).getUserSurveyByUserId(any());
    }

    @Test
    void checkUserSurveyExists_True() throws Exception {
        when(userSurveyService.checkUserSurveyExists(1L)).thenReturn(true);

        mockMvc.perform(get("/api/user-surveys/user/1/exists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true));

        verify(userSurveyService).checkUserSurveyExists(1L);
    }

    @Test
    void checkUserSurveyExists_False() throws Exception {
        when(userSurveyService.checkUserSurveyExists(1L)).thenReturn(false);

        mockMvc.perform(get("/api/user-surveys/user/1/exists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(false));

        verify(userSurveyService).checkUserSurveyExists(1L);
    }

    @Test
    void checkUserSurveyExists_InvalidId() throws Exception {
        mockMvc.perform(get("/api/user-surveys/user/0/exists"))
                .andExpect(status().isBadRequest());

        verify(userSurveyService, never()).checkUserSurveyExists(any());
    }

    @Test
    void createUserSurvey_Success() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setSurveyId(null); // New survey shouldn't have ID
        UserSurveyDTO savedSurvey = createSampleUserSurveyDTO();
        
        when(userSurveyService.createUserSurvey(any(UserSurveyDTO.class))).thenReturn(savedSurvey);

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.surveyId").value(1L))
                .andExpect(jsonPath("$.userId").value(1L));

        verify(userSurveyService).createUserSurvey(any(UserSurveyDTO.class));
    }

    @Test
    void createUserSurvey_NullRequest() throws Exception {
        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserSurvey_MissingUserId() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setUserId(null);

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("User ID is required"));

        verify(userSurveyService, never()).createUserSurvey(any());
    }

    @Test
    void createUserSurvey_EmptyIntroduction() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setIntroduction("");

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Introduction is required"));

        verify(userSurveyService, never()).createUserSurvey(any());
    }

    @Test
    void createUserSurvey_InvalidInterestsCount() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setInterests(Arrays.asList("Adventure", "Culture", "Food")); // Only 3 interests

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Exactly 5 interests are required"));

        verify(userSurveyService, never()).createUserSurvey(any());
    }

    @Test
    void createUserSurvey_EmptyTravelStyle() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setTravelStyle("");

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Travel style is required"));

        verify(userSurveyService, never()).createUserSurvey(any());
    }

    @Test
    void createUserSurvey_EmptyExperienceBudget() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setExperienceBudget("");

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Experience budget is required"));

        verify(userSurveyService, never()).createUserSurvey(any());
    }

    @Test
    void createUserSurvey_ServiceException() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        when(userSurveyService.createUserSurvey(any(UserSurveyDTO.class)))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(post("/api/user-surveys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Internal server error: Database error"));

        verify(userSurveyService).createUserSurvey(any(UserSurveyDTO.class));
    }

    @Test
    void updateUserSurvey_Success() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        when(userSurveyService.updateUserSurvey(eq(1L), any(UserSurveyDTO.class)))
                .thenReturn(Optional.of(survey));

        mockMvc.perform(put("/api/user-surveys/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.surveyId").value(1L));

        verify(userSurveyService).updateUserSurvey(eq(1L), any(UserSurveyDTO.class));
    }

    @Test
    void updateUserSurvey_NotFound() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        when(userSurveyService.updateUserSurvey(eq(1L), any(UserSurveyDTO.class)))
                .thenReturn(Optional.empty());

        mockMvc.perform(put("/api/user-surveys/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isNotFound());

        verify(userSurveyService).updateUserSurvey(eq(1L), any(UserSurveyDTO.class));
    }

    @Test
    void updateUserSurvey_InvalidId() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();

        mockMvc.perform(put("/api/user-surveys/0")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid survey ID"));

        verify(userSurveyService, never()).updateUserSurvey(any(), any());
    }

    @Test
    void updateUserSurvey_NullRequest() throws Exception {
        mockMvc.perform(put("/api/user-surveys/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(userSurveyService, never()).updateUserSurvey(any(), any());
    }

    @Test
    void updateUserSurvey_ValidationError() throws Exception {
        UserSurveyDTO survey = createSampleUserSurveyDTO();
        survey.setIntroduction(""); // Invalid

        mockMvc.perform(put("/api/user-surveys/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Introduction is required"));

        verify(userSurveyService, never()).updateUserSurvey(any(), any());
    }

    @Test
    void deleteUserSurvey_Success() throws Exception {
        when(userSurveyService.deleteUserSurvey(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/user-surveys/1"))
                .andExpect(status().isNoContent());

        verify(userSurveyService).deleteUserSurvey(1L);
    }

    @Test
    void deleteUserSurvey_NotFound() throws Exception {
        when(userSurveyService.deleteUserSurvey(1L)).thenReturn(false);

        mockMvc.perform(delete("/api/user-surveys/1"))
                .andExpect(status().isNotFound());

        verify(userSurveyService).deleteUserSurvey(1L);
    }

    @Test
    void deleteUserSurvey_InvalidId() throws Exception {
        mockMvc.perform(delete("/api/user-surveys/0"))
                .andExpect(status().isBadRequest());

        verify(userSurveyService, never()).deleteUserSurvey(any());
    }

    @Test
    void deleteUserSurvey_ServiceException() throws Exception {
        when(userSurveyService.deleteUserSurvey(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(delete("/api/user-surveys/1"))
                .andExpect(status().isInternalServerError());

        verify(userSurveyService).deleteUserSurvey(1L);
    }
}