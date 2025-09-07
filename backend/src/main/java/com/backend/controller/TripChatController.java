package com.backend.controller;

import com.backend.entity.TripChat;
import com.backend.repository.TripChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trip-chats")
public class TripChatController {
    @Autowired
    private TripChatRepository tripChatRepository;

    @GetMapping
    public List<TripChat> getAllTripChats() {
        return tripChatRepository.findAll();
    }

    @GetMapping("/{id}")
    public TripChat getTripChatById(@PathVariable Long id) {
        return tripChatRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TripChat createTripChat(@RequestBody TripChat tripChat) {
        return tripChatRepository.save(tripChat);
    }

    @PutMapping("/{id}")
    public TripChat updateTripChat(@PathVariable Long id, @RequestBody TripChat tripChat) {
        tripChat.setTripChatId(id);
        return tripChatRepository.save(tripChat);
    }

    @DeleteMapping("/{id}")
    public void deleteTripChat(@PathVariable Long id) {
        tripChatRepository.deleteById(id);
    }
}
