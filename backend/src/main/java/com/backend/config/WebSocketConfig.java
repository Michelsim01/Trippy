package com.backend.config;

import com.backend.websocket.ChatWebSocketHandler;
import com.backend.websocket.UserNotificationWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final UserNotificationWebSocketHandler userNotificationWebSocketHandler;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler, UserNotificationWebSocketHandler userNotificationWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.userNotificationWebSocketHandler = userNotificationWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Personal chat WebSocket endpoint
        registry.addHandler(chatWebSocketHandler, "/ws/chat/**")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174");

        // Trip chat WebSocket endpoint
        registry.addHandler(chatWebSocketHandler, "/ws/trip-chat/**")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174");

        // User notification WebSocket endpoint
        registry.addHandler(userNotificationWebSocketHandler, "/ws/user/*/notifications")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174");
    }
}