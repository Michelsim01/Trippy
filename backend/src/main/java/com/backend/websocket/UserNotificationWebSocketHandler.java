package com.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class UserNotificationWebSocketHandler implements WebSocketHandler {

    private final ObjectMapper objectMapper;
    
    // Map to store active WebSocket sessions by user ID
    private final Map<Long, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    
    // Map to store session metadata
    private final Map<String, SessionInfo> sessionInfoMap = new ConcurrentHashMap<>();

    public UserNotificationWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = extractUserIdFromSession(session);
        if (userId != null) {
            // Add session to the user's notification channel
            userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
            
            // Store session info
            sessionInfoMap.put(session.getId(), new SessionInfo(userId));
            
            System.out.println("User notification WebSocket connection established for user: " + userId + 
                             ", session: " + session.getId());
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        // This handler only sends notifications, doesn't handle incoming messages
        // Message handling is done by ChatWebSocketHandler
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("User notification WebSocket transport error for session: " + session.getId());
        exception.printStackTrace();
        removeSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        System.out.println("User notification WebSocket connection closed for session: " + session.getId());
        removeSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private Long extractUserIdFromSession(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri != null) {
                String path = uri.getPath();
                System.out.println("User notification WebSocket path: " + path);
                // Extract user ID from path like /ws/user/123/notifications
                String[] pathParts = path.split("/");
                if (pathParts.length >= 5 && "ws".equals(pathParts[1]) && "user".equals(pathParts[2]) && "notifications".equals(pathParts[4])) {
                    return Long.parseLong(pathParts[3]);
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting user ID from session: " + e.getMessage());
        }
        return null;
    }

    public void notifyUsersOfNewMessage(Long chatId, Long messageId, String content, Long senderId, String senderName, String timestamp, String chatTitle, List<Long> memberUserIds) {
        try {
            // Create notification message
            ChatNotification notification = new ChatNotification();
            notification.setType("NEW_MESSAGE");
            notification.setChatId(chatId);
            notification.setMessageId(messageId);
            notification.setContent(content);
            notification.setSenderId(senderId);
            notification.setSenderName(senderName);
            notification.setTimestamp(timestamp);
            notification.setChatTitle(chatTitle);
            
            // Notify all users in the chat (except the sender)
            memberUserIds.forEach(userId -> {
                if (!userId.equals(senderId)) {
                    notifyUser(userId, notification);
                }
            });
            
        } catch (Exception e) {
            System.err.println("Error notifying users of new message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void notifyUser(Long userId, ChatNotification notification) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            String notificationJson;
            try {
                notificationJson = objectMapper.writeValueAsString(notification);
            } catch (Exception e) {
                System.err.println("Error serializing notification: " + e.getMessage());
                return;
            }
            
            // Send to all sessions for this user
            sessions.removeIf(session -> {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(notificationJson));
                        return false;
                    } else {
                        return true; // Remove closed sessions
                    }
                } catch (IOException e) {
                    System.err.println("Error sending notification to session: " + e.getMessage());
                    return true; // Remove failed sessions
                }
            });
        }
    }

    private void removeSession(WebSocketSession session) {
        SessionInfo sessionInfo = sessionInfoMap.remove(session.getId());
        if (sessionInfo != null) {
            Long userId = sessionInfo.getUserId();
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
        }
    }

    // Inner classes for data transfer
    public static class ChatNotification {
        private String type;
        private Long chatId;
        private Long messageId;
        private String content;
        private Long senderId;
        private String senderName;
        private String timestamp;
        private String chatTitle;

        // Getters and Setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public Long getChatId() { return chatId; }
        public void setChatId(Long chatId) { this.chatId = chatId; }
        
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
        
        public String getChatTitle() { return chatTitle; }
        public void setChatTitle(String chatTitle) { this.chatTitle = chatTitle; }
    }

    private static class SessionInfo {
        private final Long userId;

        public SessionInfo(Long userId) {
            this.userId = userId;
        }

        public Long getUserId() {
            return userId;
        }
    }
}