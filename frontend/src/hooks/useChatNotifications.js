import { useState, useEffect, useRef, useCallback } from 'react';

const useChatNotifications = (currentUserId) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [chatNotifications, setChatNotifications] = useState([]);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    // WebSocket connection for chat notifications
    const connect = useCallback(() => {
        if (!currentUserId) return;

        try {
            // Close existing connection first
            setSocket(prevSocket => {
                if (prevSocket && prevSocket.readyState === WebSocket.OPEN) {
                    prevSocket.close(1000, 'Creating new connection');
                }
                return null;
            });
            
            const wsUrl = `ws://localhost:8080/ws/user/${currentUserId}/notifications`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Chat notifications WebSocket connected for user:', currentUserId);
                setSocket(ws);
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    console.log('Received chat notification:', notification);
                    
                    if (notification.type === 'NEW_MESSAGE') {
                        // Add chat notification to the queue
                        setChatNotifications(prev => [...prev, notification]);
                    }
                } catch (error) {
                    console.error('Error parsing chat notification:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('Chat notifications WebSocket disconnected:', event.code, event.reason);
                setSocket(null);
                setIsConnected(false);
                
                // Only attempt reconnection for unexpected closures and if we haven't exceeded max attempts
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`Attempting to reconnect chat notifications in ${timeout}ms...`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, timeout);
                }
            };

            ws.onerror = (error) => {
                console.error('Chat notifications WebSocket error:', error);
            };

        } catch (error) {
            console.error('Error creating chat notifications WebSocket connection:', error);
        }
    }, [currentUserId]);

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        setSocket(prevSocket => {
            if (prevSocket) {
                prevSocket.close(1000, 'Component unmounting');
            }
            return null;
        });
        
        setIsConnected(false);
    }, []);

    // Connect when userId changes
    useEffect(() => {
        if (currentUserId) {
            connect();
        }
        
        return disconnect;
    }, [currentUserId, connect, disconnect]);

    // Clear chat notifications
    const clearChatNotifications = useCallback(() => {
        setChatNotifications([]);
    }, []);

    // Remove specific chat notification
    const removeChatNotification = useCallback((notificationIndex) => {
        setChatNotifications(prev => prev.filter((_, index) => index !== notificationIndex));
    }, []);

    // Get notifications for a specific chat
    const getNotificationsForChat = useCallback((chatId) => {
        return chatNotifications.filter(notification => notification.chatId === chatId);
    }, [chatNotifications]);

    return {
        isConnected,
        chatNotifications,
        clearChatNotifications,
        removeChatNotification,
        getNotificationsForChat
    };
};

export default useChatNotifications;