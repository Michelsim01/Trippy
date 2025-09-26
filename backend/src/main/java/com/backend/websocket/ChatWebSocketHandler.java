package com.backend.websocket;

import com.backend.entity.Message;
import com.backend.entity.PersonalChat;
import com.backend.entity.User;
import com.backend.entity.MessageTypeEnum;
import com.backend.repository.MessageRepository;
import com.backend.repository.PersonalChatRepository;
import com.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {

    private final MessageRepository messageRepository;
    private final PersonalChatRepository personalChatRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    // Map to store active WebSocket sessions by chat ID
    private final Map<Long, Set<WebSocketSession>> chatSessions = new ConcurrentHashMap<>();
    
    // Map to store session metadata
    private final Map<String, SessionInfo> sessionInfoMap = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(
            MessageRepository messageRepository,
            PersonalChatRepository personalChatRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.messageRepository = messageRepository;
        this.personalChatRepository = personalChatRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long chatId = extractChatIdFromSession(session);
        if (chatId != null) {
            // Add session to the chat room
            chatSessions.computeIfAbsent(chatId, k -> ConcurrentHashMap.newKeySet()).add(session);
            
            // Store session info
            sessionInfoMap.put(session.getId(), new SessionInfo(chatId));
            
            System.out.println("WebSocket connection established for chat: " + chatId + 
                             ", session: " + session.getId());
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        if (message instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) message;
            try {
                // Parse the incoming message
                ChatMessage chatMessage = objectMapper.readValue(textMessage.getPayload(), ChatMessage.class);
                
                Long chatId = extractChatIdFromSession(session);
                if (chatId != null && chatMessage.getSenderId() != null && chatMessage.getContent() != null) {
                    // Save message to database
                    Message savedMessage = saveMessageToDatabase(chatId, chatMessage);
                    
                    if (savedMessage != null) {
                        // Create response message
                        ChatMessage response = new ChatMessage();
                        response.setMessageId(savedMessage.getMessageId());
                        response.setContent(savedMessage.getContent());
                        response.setSenderId(savedMessage.getSender().getId());
                        response.setSenderName(savedMessage.getSender().getFirstName() + " " + savedMessage.getSender().getLastName());
                        response.setTimestamp(savedMessage.getCreatedAt().toString());
                        response.setChatId(chatId);
                        
                        // Broadcast to all sessions in this chat
                        broadcastToChat(chatId, response);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error handling WebSocket message: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("WebSocket transport error for session: " + session.getId());
        exception.printStackTrace();
        removeSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        System.out.println("WebSocket connection closed for session: " + session.getId());
        removeSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private Long extractChatIdFromSession(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri != null) {
                String path = uri.getPath();
                System.out.println("WebSocket path: " + path);
                // Extract chat ID from path like /ws/chat/123
                String[] pathParts = path.split("/");
                if (pathParts.length >= 4 && "ws".equals(pathParts[1]) && "chat".equals(pathParts[2])) {
                    return Long.parseLong(pathParts[3]);
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting chat ID from session: " + e.getMessage());
        }
        return null;
    }

    private Message saveMessageToDatabase(Long chatId, ChatMessage chatMessage) {
        try {
            Optional<PersonalChat> personalChat = personalChatRepository.findById(chatId);
            Optional<User> sender = userRepository.findById(chatMessage.getSenderId());
            
            if (personalChat.isPresent() && sender.isPresent()) {
                Message message = new Message();
                message.setPersonalChat(personalChat.get());
                message.setSender(sender.get());
                message.setContent(chatMessage.getContent());
                message.setMessageType(MessageTypeEnum.TEXT);
                message.setCreatedAt(LocalDateTime.now());
                message.setUpdatedAt(LocalDateTime.now());
                
                return messageRepository.save(message);
            }
        } catch (Exception e) {
            System.err.println("Error saving message to database: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    private void broadcastToChat(Long chatId, ChatMessage message) {
        Set<WebSocketSession> sessions = chatSessions.get(chatId);
        if (sessions != null) {
            String messageJson;
            try {
                messageJson = objectMapper.writeValueAsString(message);
            } catch (Exception e) {
                System.err.println("Error serializing message: " + e.getMessage());
                return;
            }
            
            // Send to all sessions in this chat
            sessions.removeIf(session -> {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(messageJson));
                        return false;
                    } else {
                        return true; // Remove closed sessions
                    }
                } catch (IOException e) {
                    System.err.println("Error sending message to session: " + e.getMessage());
                    return true; // Remove failed sessions
                }
            });
        }
    }

    private void removeSession(WebSocketSession session) {
        SessionInfo sessionInfo = sessionInfoMap.remove(session.getId());
        if (sessionInfo != null) {
            Long chatId = sessionInfo.getChatId();
            Set<WebSocketSession> sessions = chatSessions.get(chatId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    chatSessions.remove(chatId);
                }
            }
        }
    }

    // Inner classes for data transfer
    public static class ChatMessage {
        private Long messageId;
        private String content;
        private Long senderId;
        private String senderName;
        private String timestamp;
        private Long chatId;

        // Getters and Setters
        public Long getMessageId() { return messageId; }
        public void setMessageId(Long messageId) { this.messageId = messageId; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public Long getSenderId() { return senderId; }
        public void setSenderId(Long senderId) { this.senderId = senderId; }
        
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        
        public Long getChatId() { return chatId; }
        public void setChatId(Long chatId) { this.chatId = chatId; }
    }

    private static class SessionInfo {
        private final Long chatId;

        public SessionInfo(Long chatId) {
            this.chatId = chatId;
        }

        public Long getChatId() {
            return chatId;
        }
    }
}