package com.backend.controller;

import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        objectMapper = new ObjectMapper();
    }

    private User createSampleUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPhoneNumber("+1234567890");
        user.setPassword("hashedPassword");
        user.setProfileImageUrl("/uploads/profile.jpg");
        user.setAverageRating(BigDecimal.valueOf(4.5));
        return user;
    }

    private Experience createSampleExperience() {
        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setTitle("City Tour");
        experience.setTotalReviews(10);
        return experience;
    }

    @Test
    void getAllUsers_Success() throws Exception {
        List<User> users = Arrays.asList(createSampleUser());
        when(userRepository.findAll()).thenReturn(users);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].email").value("test@example.com"));

        verify(userRepository).findAll();
    }

    @Test
    void getAllUsers_ServiceException() throws Exception {
        when(userRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isInternalServerError());

        verify(userRepository).findAll();
    }

    @Test
    void getUserById_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"));

        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_NotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isNotFound());

        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_InvalidId() throws Exception {
        mockMvc.perform(get("/api/users/0"))
                .andExpect(status().isBadRequest());

        verify(userRepository, never()).findById(any());
    }

    @Test
    void getUserById_ServiceException() throws Exception {
        when(userRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isInternalServerError());

        verify(userRepository).findById(1L);
    }

    @Test
    void createUser_Success() throws Exception {
        User user = createSampleUser();
        user.setId(null); // New user shouldn't have ID
        User savedUser = createSampleUser();
        
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_EmailAlreadyExists() throws Exception {
        User user = createSampleUser();
        user.setId(null);
        
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isConflict());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_NullRequest() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(user);

        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(userRepository).existsById(1L);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_NotFound() throws Exception {
        User user = createSampleUser();
        when(userRepository.existsById(1L)).thenReturn(false);

        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isNotFound());

        verify(userRepository).existsById(1L);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_InvalidId() throws Exception {
        User user = createSampleUser();

        mockMvc.perform(put("/api/users/0")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isBadRequest());

        verify(userRepository, never()).existsById(any());
    }

    @Test
    void updateUserDetails_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        Map<String, String> updates = Map.of(
            "firstName", "Jane",
            "lastName", "Smith",
            "email", "jane@example.com"
        );

        mockMvc.perform(put("/api/users/1/details")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                .andExpect(jsonPath("$.user").exists());

        verify(userRepository).findById(1L);
        verify(userRepository).save(user);
    }

    @Test
    void updateUserDetails_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        Map<String, String> updates = Map.of("firstName", "Jane");

        mockMvc.perform(put("/api/users/1/details")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));

        verify(userRepository).findById(1L);
        verify(userRepository, never()).save(any());
    }

    @Test
    void changeUserPassword_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPassword")).thenReturn("hashedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        Map<String, String> passwordUpdate = Map.of("newPassword", "newPassword");

        mockMvc.perform(put("/api/users/1/changePassword")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(passwordUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        verify(userRepository).findById(1L);
        verify(passwordEncoder).encode("newPassword");
        verify(userRepository).save(user);
    }

    @Test
    void changeUserPassword_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        Map<String, String> passwordUpdate = Map.of("newPassword", "newPassword");

        mockMvc.perform(put("/api/users/1/changePassword")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(passwordUpdate)))
                .andExpect(status().isNotFound());

        verify(userRepository).findById(1L);
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void verifyPassword_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("currentPassword", "hashedPassword")).thenReturn(true);

        Map<String, String> passwordRequest = Map.of("password", "currentPassword");

        mockMvc.perform(post("/api/users/1/verifyPassword")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(passwordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isValid").value(true));

        verify(userRepository).findById(1L);
        verify(passwordEncoder).matches("currentPassword", "hashedPassword");
    }

    @Test
    void verifyPassword_Invalid() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        Map<String, String> passwordRequest = Map.of("password", "wrongPassword");

        mockMvc.perform(post("/api/users/1/verifyPassword")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(passwordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isValid").value(false));

        verify(userRepository).findById(1L);
        verify(passwordEncoder).matches("wrongPassword", "hashedPassword");
    }

    @Test
    void verifyPassword_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        Map<String, String> passwordRequest = Map.of("password", "password");

        mockMvc.perform(post("/api/users/1/verifyPassword")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(passwordRequest)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.isValid").value(false));

        verify(userRepository).findById(1L);
    }

    @Test
    void deleteUser_Success() throws Exception {
        doNothing().when(userRepository).deleteById(1L);

        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isOk());

        verify(userRepository).deleteById(1L);
    }

    @Test
    void getUserStats_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/users/1/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(4.5));

        verify(userRepository).findById(1L);
    }

    @Test
    void getUserStats_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/1/stats"))
                .andExpect(status().isNotFound());

        verify(userRepository).findById(1L);
    }

    @Test
    void getGuideStats_Success() throws Exception {
        User user = createSampleUser();
        List<Experience> experiences = Arrays.asList(createSampleExperience());
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(experienceRepository.findByGuide_Id(1L)).thenReturn(experiences);

        mockMvc.perform(get("/api/users/1/guide-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.totalReviews").value(10))
                .andExpect(jsonPath("$.totalExperiences").value(1));

        verify(userRepository).findById(1L);
        verify(experienceRepository).findByGuide_Id(1L);
    }

    @Test
    void getGuideStats_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/1/guide-stats"))
                .andExpect(status().isNotFound());

        verify(userRepository).findById(1L);
        verify(experienceRepository, never()).findByGuide_Id(any());
    }

    @Test
    void uploadProfilePicture_Success() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        MockMultipartFile file = new MockMultipartFile(
            "file", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        mockMvc.perform(multipart("/api/users/1/profile-picture")
                .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile picture uploaded successfully"))
                .andExpect(jsonPath("$.imageUrl").exists());

        verify(userRepository).findById(1L);
        verify(userRepository).save(user);
    }

    @Test
    void uploadProfilePicture_UserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        MockMultipartFile file = new MockMultipartFile(
            "file", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        mockMvc.perform(multipart("/api/users/1/profile-picture")
                .file(file))
                .andExpect(status().isNotFound());

        verify(userRepository).findById(1L);
        verify(userRepository, never()).save(any());
    }

    @Test
    void uploadProfilePicture_EmptyFile() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        MockMultipartFile file = new MockMultipartFile(
            "file", 
            "test.jpg", 
            "image/jpeg", 
            new byte[0]
        );

        mockMvc.perform(multipart("/api/users/1/profile-picture")
                .file(file))
                .andExpect(status().isBadRequest());

        verify(userRepository).findById(1L);
        verify(userRepository, never()).save(any());
    }

    @Test
    void uploadProfilePicture_InvalidFileType() throws Exception {
        User user = createSampleUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        MockMultipartFile file = new MockMultipartFile(
            "file", 
            "test.txt", 
            "text/plain", 
            "test content".getBytes()
        );

        mockMvc.perform(multipart("/api/users/1/profile-picture")
                .file(file))
                .andExpect(status().isBadRequest());

        verify(userRepository).findById(1L);
        verify(userRepository, never()).save(any());
    }
}