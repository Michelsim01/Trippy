package com.backend.controller;

import com.backend.entity.PersonalChat;
import com.backend.repository.PersonalChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/personal-chats")
public class PersonalChatController {
    @Autowired
    private PersonalChatRepository personalChatRepository;

    @GetMapping
    public List<PersonalChat> getAllPersonalChats() {
        return personalChatRepository.findAll();
    }

    @GetMapping("/{id}")
    public PersonalChat getPersonalChatById(@PathVariable Long id) {
        return personalChatRepository.findById(id).orElse(null);
    }

    @PostMapping
    public PersonalChat createPersonalChat(@RequestBody PersonalChat personalChat) {
        return personalChatRepository.save(personalChat);
    }

    @PutMapping("/{id}")
    public PersonalChat updatePersonalChat(@PathVariable Long id, @RequestBody PersonalChat personalChat) {
        personalChat.setPersonalChatId(id);
        return personalChatRepository.save(personalChat);
    }

    @DeleteMapping("/{id}")
    public void deletePersonalChat(@PathVariable Long id) {
        personalChatRepository.deleteById(id);
    }
}
