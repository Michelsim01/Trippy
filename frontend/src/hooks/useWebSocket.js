import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (chatId, currentUserId, chatType = 'personal') => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [incomingMessages, setIncomingMessages] = useState([]);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    // WebSocket connection
    const connect = useCallback(() => {
        if (!chatId || !currentUserId) return;

        try {
            // Close existing connection first
            setSocket(prevSocket => {
                if (prevSocket && prevSocket.readyState === WebSocket.OPEN) {
                    prevSocket.close(1000, 'Creating new connection');
                }
                return null;
            });

            // Use different WebSocket path based on chat type
            const wsPath = chatType === 'trip' ? 'trip-chat' : 'chat';
            const wsUrl = `ws://localhost:8080/ws/${wsPath}/${chatId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected for chat:', chatId);
                setSocket(ws);
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('Received WebSocket message:', message);
                    
                    // Format message for the UI
                    const formattedMessage = {
                        id: message.messageId,
                        sender: message.senderId === currentUserId ? 'You' : message.senderName,
                        text: message.content,
                        timestamp: new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        senderId: message.senderId
                    };
                    
                    setIncomingMessages(prev => [...prev, formattedMessage]);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setSocket(null);
                setIsConnected(false);
                
                // Only attempt reconnection for unexpected closures and if we haven't exceeded max attempts
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`Attempting to reconnect in ${timeout}ms...`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, timeout);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }, [chatId, currentUserId, chatType]);

    // Send message via WebSocket
    const sendMessage = useCallback((messageContent) => {
        if (socket && socket.readyState === WebSocket.OPEN && currentUserId) {
            const message = {
                content: messageContent,
                senderId: currentUserId,
                chatId: chatId
            };
            
            console.log('Sending WebSocket message:', message);
            socket.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
    }, [socket, currentUserId, chatId]);

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

    // Connect when chatId changes
    useEffect(() => {
        if (chatId && currentUserId) {
            connect();
        }
        
        return disconnect;
    }, [chatId, currentUserId]);

    // Clear incoming messages when chat changes
    useEffect(() => {
        setIncomingMessages([]);
    }, [chatId]);

    return {
        isConnected,
        sendMessage,
        incomingMessages,
        clearIncomingMessages: () => setIncomingMessages([])
    };
};

export default useWebSocket;