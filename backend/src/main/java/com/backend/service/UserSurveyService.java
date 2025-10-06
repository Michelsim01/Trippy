package com.backend.service;

import com.backend.dto.UserSurveyDTO;
import com.backend.entity.User;
import com.backend.entity.UserSurvey;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSurveyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserSurveyService {
    
    @Autowired
    private UserSurveyRepository userSurveyRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<UserSurveyDTO> getAllUserSurveys() {
        return userSurveyRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<UserSurveyDTO> getUserSurveyById(Long id) {
        return userSurveyRepository.findById(id)
                .map(this::convertToDTO);
    }

    public Optional<UserSurveyDTO> getUserSurveyByUserId(Long userId) {
        return userSurveyRepository.findByUser_Id(userId)
                .map(this::convertToDTO);
    }

    public boolean checkUserSurveyExists(Long userId) {
        return userSurveyRepository.existsByUser_Id(userId);
    }

    public UserSurveyDTO createUserSurvey(UserSurveyDTO userSurveyDTO) {
        UserSurvey userSurvey = convertToEntity(userSurveyDTO);
        UserSurvey savedUserSurvey = userSurveyRepository.save(userSurvey);
        return convertToDTO(savedUserSurvey);
    }

    public Optional<UserSurveyDTO> updateUserSurvey(Long id, UserSurveyDTO userSurveyDTO) {
        try {
            if (!userSurveyRepository.existsById(id)) {
                System.err.println("Survey with ID " + id + " does not exist");
                return Optional.empty();
            }
            
            System.out.println("Converting DTO to entity for survey ID: " + id);
            userSurveyDTO.setSurveyId(id);
            UserSurvey userSurvey = convertToEntity(userSurveyDTO);
            
            System.out.println("Saving updated survey to database");
            UserSurvey savedUserSurvey = userSurveyRepository.save(userSurvey);
            
            System.out.println("Survey updated successfully with ID: " + savedUserSurvey.getSurveyId());
            return Optional.of(convertToDTO(savedUserSurvey));
        } catch (Exception e) {
            System.err.println("Error in updateUserSurvey service: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to be caught by controller
        }
    }

    public boolean deleteUserSurvey(Long id) {
        if (!userSurveyRepository.existsById(id)) {
            return false;
        }
        userSurveyRepository.deleteById(id);
        return true;
    }

    private UserSurveyDTO convertToDTO(UserSurvey userSurvey) {
        UserSurveyDTO dto = new UserSurveyDTO();
        dto.setSurveyId(userSurvey.getSurveyId());
        dto.setUserId(userSurvey.getUser().getId());
        dto.setIntroduction(userSurvey.getIntroduction());
        dto.setInterests(userSurvey.getInterests());
        dto.setTravelStyle(userSurvey.getTravelStyle());
        dto.setExperienceBudget(userSurvey.getExperienceBudget());
        dto.setCompletedAt(userSurvey.getCompletedAt());
        return dto;
    }

    private UserSurvey convertToEntity(UserSurveyDTO dto) {
        try {
            UserSurvey userSurvey = new UserSurvey();
            userSurvey.setSurveyId(dto.getSurveyId());
            
            // Find and set the User entity
            System.out.println("Looking for user with ID: " + dto.getUserId());
            Optional<User> user = userRepository.findById(dto.getUserId());
            if (user.isPresent()) {
                userSurvey.setUser(user.get());
                System.out.println("Found user: " + user.get().getEmail());
            } else {
                System.err.println("User not found with ID: " + dto.getUserId());
                throw new RuntimeException("User not found with ID: " + dto.getUserId());
            }
            
            userSurvey.setIntroduction(dto.getIntroduction());
            userSurvey.setInterests(dto.getInterests());
            userSurvey.setTravelStyle(dto.getTravelStyle());
            userSurvey.setExperienceBudget(dto.getExperienceBudget());
            userSurvey.setCompletedAt(dto.getCompletedAt());
            
            System.out.println("Successfully converted DTO to entity");
            return userSurvey;
        } catch (Exception e) {
            System.err.println("Error converting DTO to entity: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}