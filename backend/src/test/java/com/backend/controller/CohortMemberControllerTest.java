package com.backend.controller;

import com.backend.entity.CohortMember;
import com.backend.entity.User;
import com.backend.repository.CohortMemberRepository;
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

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for CohortMemberController.
 * Tests controller logic in isolation with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class CohortMemberControllerTest {

    @Mock
    private CohortMemberRepository cohortMemberRepository;

    @InjectMocks
    private CohortMemberController cohortMemberController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cohortMemberController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testGetAllCohortMembers_Success() throws Exception {
        // Arrange
        List<CohortMember> cohortMembers = Arrays.asList(
                createTestCohortMember(1L),
                createTestCohortMember(2L)
        );
        when(cohortMemberRepository.findAll()).thenReturn(cohortMembers);

        // Act & Assert
        mockMvc.perform(get("/api/cohort-members"))
                .andExpect(status().isOk());

        verify(cohortMemberRepository).findAll();
    }

    @Test
    void testGetCohortMemberById_Success() throws Exception {
        // Arrange
        CohortMember cohortMember = createTestCohortMember(1L);
        when(cohortMemberRepository.findById(1L)).thenReturn(Optional.of(cohortMember));

        // Act & Assert
        mockMvc.perform(get("/api/cohort-members/1"))
                .andExpect(status().isOk());

        verify(cohortMemberRepository).findById(1L);
    }

    @Test
    void testGetCohortMemberById_NotFound() throws Exception {
        // Arrange
        when(cohortMemberRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/cohort-members/999"))
                .andExpect(status().isNotFound());

        verify(cohortMemberRepository).findById(999L);
    }

    @Test
    void testGetCohortMemberById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/cohort-members/0"))
                .andExpect(status().isBadRequest());

        verify(cohortMemberRepository, never()).findById(anyLong());
    }

    @Test
    void testCreateCohortMember_Success() throws Exception {
        // Arrange
        CohortMember cohortMember = createTestCohortMember(1L);
        when(cohortMemberRepository.save(any(CohortMember.class))).thenReturn(cohortMember);

        // Act & Assert
        mockMvc.perform(post("/api/cohort-members")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cohortMember)))
                .andExpect(status().isCreated());

        verify(cohortMemberRepository).save(any(CohortMember.class));
    }

    @Test
    void testCreateCohortMember_NullInput() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/cohort-members")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(cohortMemberRepository, never()).save(any(CohortMember.class));
    }

    @Test
    void testUpdateCohortMember_Success() throws Exception {
        // Arrange
        CohortMember cohortMember = createTestCohortMember(1L);
        when(cohortMemberRepository.existsById(1L)).thenReturn(true);
        when(cohortMemberRepository.save(any(CohortMember.class))).thenReturn(cohortMember);

        // Act & Assert
        mockMvc.perform(put("/api/cohort-members/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cohortMember)))
                .andExpect(status().isOk());

        verify(cohortMemberRepository).existsById(1L);
        verify(cohortMemberRepository).save(any(CohortMember.class));
    }

    @Test
    void testUpdateCohortMember_NotFound() throws Exception {
        // Arrange
        CohortMember cohortMember = createTestCohortMember(999L);
        when(cohortMemberRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(put("/api/cohort-members/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cohortMember)))
                .andExpect(status().isNotFound());

        verify(cohortMemberRepository).existsById(999L);
        verify(cohortMemberRepository, never()).save(any(CohortMember.class));
    }

    @Test
    void testDeleteCohortMember_Success() throws Exception {
        // Arrange
        when(cohortMemberRepository.existsById(1L)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/cohort-members/1"))
                .andExpect(status().isNoContent());

        verify(cohortMemberRepository).existsById(1L);
        verify(cohortMemberRepository).deleteById(1L);
    }

    @Test
    void testDeleteCohortMember_NotFound() throws Exception {
        // Arrange
        when(cohortMemberRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/cohort-members/999"))
                .andExpect(status().isNotFound());

        verify(cohortMemberRepository).existsById(999L);
        verify(cohortMemberRepository, never()).deleteById(anyLong());
    }

    @Test
    void testDeleteCohortMember_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/cohort-members/0"))
                .andExpect(status().isBadRequest());

        verify(cohortMemberRepository, never()).existsById(anyLong());
        verify(cohortMemberRepository, never()).deleteById(anyLong());
    }

    // Helper methods for creating test objects
    private CohortMember createTestCohortMember(Long id) {
        CohortMember cohortMember = new CohortMember();
        cohortMember.setId(id);
        
        // Create a test user
        User user = new User();
        user.setId(id);
        user.setEmail("user" + id + "@example.com");
        user.setFirstName("User");
        user.setLastName(String.valueOf(id));
        cohortMember.setUser(user);
        
        return cohortMember;
    }
}