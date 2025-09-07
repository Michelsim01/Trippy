package com.backend.controller;

import com.backend.entity.UserSurvey;
import com.backend.repository.UserSurveyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user-surveys")
public class UserSurveyController {
    @Autowired
    private UserSurveyRepository userSurveyRepository;

    @GetMapping
    public List<UserSurvey> getAllUserSurveys() {
        return userSurveyRepository.findAll();
    }

    @GetMapping("/{id}")
    public UserSurvey getUserSurveyById(@PathVariable Long id) {
        return userSurveyRepository.findById(id).orElse(null);
    }

    @PostMapping
    public UserSurvey createUserSurvey(@RequestBody UserSurvey userSurvey) {
        return userSurveyRepository.save(userSurvey);
    }

    @PutMapping("/{id}")
    public UserSurvey updateUserSurvey(@PathVariable Long id, @RequestBody UserSurvey userSurvey) {
        userSurvey.setSurveyId(id);
        return userSurveyRepository.save(userSurvey);
    }

    @DeleteMapping("/{id}")
    public void deleteUserSurvey(@PathVariable Long id) {
        userSurveyRepository.deleteById(id);
    }
}
