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
        registry.addHandler(chatWebSocketHandler, "/ws/chat/**")
                .setAllowedOrigins("*");
        
        registry.addHandler(userNotificationWebSocketHandler, "/ws/user/*/notifications")
                .setAllowedOrigins("*");
    }
}