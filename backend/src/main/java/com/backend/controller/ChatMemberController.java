package com.backend.controller;

import com.backend.entity.ChatMember;
import com.backend.repository.ChatMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat-members")
public class ChatMemberController {
    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @GetMapping
    public List<ChatMember> getAllChatMembers() {
        return chatMemberRepository.findAll();
    }

    @GetMapping("/{id}")
    public ChatMember getChatMemberById(@PathVariable Long id) {
        return chatMemberRepository.findById(id).orElse(null);
    }

    @PostMapping
    public ChatMember createChatMember(@RequestBody ChatMember chatMember) {
        return chatMemberRepository.save(chatMember);
    }

    @PutMapping("/{id}")
    public ChatMember updateChatMember(@PathVariable Long id, @RequestBody ChatMember chatMember) {
        chatMember.setId(id);
        return chatMemberRepository.save(chatMember);
    }

    @DeleteMapping("/{id}")
    public void deleteChatMember(@PathVariable Long id) {
        chatMemberRepository.deleteById(id);
    }
}
