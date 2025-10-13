import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useWebSocket from '../hooks/useWebSocket';
import useChatNotifications from '../hooks/useChatNotifications';
import { unreadCountManager } from '../utils/unreadCountManager';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConversationList from '../components/messages/ConversationList';
import ChatHeader from '../components/messages/ChatHeader';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import EmptyState from '../components/messages/EmptyState';
import SearchBar from '../components/messages/SearchBar';
import AIChatButton from '../components/messages/AIChatButton';

const MessagesPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null); // Just stores the chat ID
    const [newMessage, setNewMessage] = useState('');
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState({});
    const [loadingMessages, setLoadingMessages] = useState(false);

    // WebSocket integration
    const currentUserId = user?.id || user?.userId;
    const selectedConversation = conversations.find(c => c.id === selectedChat);
    const chatType = selectedConversation?.isTripChat ? 'trip' : 'personal';
    const { isConnected, sendMessage: sendWebSocketMessage, incomingMessages, clearIncomingMessages } = useWebSocket(selectedChat, currentUserId, chatType);
    
    // Chat notifications for conversation list updates
    const { chatNotifications, clearChatNotifications } = useChatNotifications(currentUserId);

    // Load user chats on component mount
    useEffect(() => {
        const loadUserChats = async () => {
            if (!user) return;

            try {
                const userId = user.id || user.userId;

                // Fetch personal chats
                const personalChatsResponse = await fetch(`http://localhost:8080/api/personal-chats/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                // Fetch trip chats
                const tripChatsResponse = await fetch(`http://localhost:8080/api/trip-chats/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                let allConversations = [];

                // Process personal chats
                if (personalChatsResponse.ok) {
                    const personalChats = await personalChatsResponse.json();
                    const formattedPersonalChats = personalChats.map(chat => {
                        // Get participant names from chat members
                        const currentUserId = user.id || user.userId;
                        const otherParticipant = chat.chatMembers?.find(member => member.user.id !== currentUserId);
                        const participantName = otherParticipant ?
                            `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}` :
                            "Guide";

                        return {
                            id: chat.personalChatId,
                            type: 'personal',
                            title: chat.experience?.title || chat.name || "Chat with Guide",
                            lastMessage: chat.lastMessage || "Start chatting...",
                            timestamp: new Date(chat.createdAt).toLocaleDateString(),
                            participants: `You & ${participantName}`,
                            participantName: participantName,
                            activity: chat.experience?.category || (chat.experience ? "Experience" : "Experience Unavailable"),
                            avatar: chat.experience?.coverPhotoUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                            unreadCount: chat.unreadCount || 0,
                            experience: chat.experience,
                            chatMembers: chat.chatMembers
                        };
                    });
                    allConversations = [...allConversations, ...formattedPersonalChats];
                } else {
                    console.error('Failed to load personal chats');
                }

                // Process trip chats
                if (tripChatsResponse.ok) {
                    const tripChats = await tripChatsResponse.json();
                    console.log('Trip chats data:', tripChats.map(chat => ({
                        id: chat.personalChatId,
                        name: chat.name,
                        chatMembers: chat.chatMembers,
                        memberCount: chat.chatMembers?.length
                    })));
                    const formattedTripChats = tripChats.map(chat => {
                        // Get schedule info from trip cohort
                        const schedule = chat.tripCohort?.experienceSchedule;
                        const experience = schedule?.experience;
                        const memberCount = chat.chatMembers?.length || 0;

                        return {
                            id: chat.personalChatId,
                            isTripChat: true,
                            title: chat.name || "Trip Channel",
                            lastMessage: chat.lastMessage || "Start chatting with your group...",
                            timestamp: new Date(chat.createdAt).toLocaleDateString(),
                            participants: `Group chat (${memberCount} members)`,
                            activity: "Trip Channel",
                            avatar: experience?.coverPhotoUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
                            unreadCount: chat.unreadCount || 0,
                            chatMembers: chat.chatMembers,
                            tripCohort: chat.tripCohort,
                            schedule: schedule,
                            experience: experience
                        };
                    });
                    allConversations = [...allConversations, ...formattedTripChats];
                } else {
                    console.error('Failed to load trip chats');
                }

                // Sort all conversations by timestamp (most recent first)
                allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setConversations(allConversations);
            } catch (error) {
                console.error('Error loading chats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserChats();
    }, [user]);
    
    // Handle incoming WebSocket messages
    useEffect(() => {
        if (incomingMessages.length > 0 && selectedChat) {
            // Add only new messages and prevent duplicates
            setChatMessages(prev => {
                const currentMessages = prev[selectedChat] || [];
                const existingIds = new Set(currentMessages.map(msg => msg.id));
                const newMessages = incomingMessages.filter(msg => !existingIds.has(msg.id));
                
                if (newMessages.length > 0) {
                    // Update last message in conversations list
                    const lastMessage = newMessages[newMessages.length - 1];
                    setConversations(prevConversations => 
                        prevConversations.map(conv => 
                            conv.id === selectedChat 
                                ? { ...conv, lastMessage: lastMessage.text }
                                : conv
                        )
                    );
                    
                    return {
                        ...prev,
                        [selectedChat]: [...currentMessages, ...newMessages]
                    };
                }
                return prev;
            });
            
            // Clear incoming messages after processing
            clearIncomingMessages();
        }
    }, [incomingMessages, selectedChat, clearIncomingMessages]);

    // Load messages for a specific chat
    const loadChatMessages = async (chatId) => {
        // Check if we need to reload messages
        const hasMessages = chatMessages[chatId] && chatMessages[chatId].length > 0;
        const conversation = conversations.find(c => c.id === chatId);
        const hasUnreadMessages = conversation && conversation.unreadCount > 0;
        
        // Always load if no messages exist, or if there are unread messages
        // This ensures we get the latest messages when switching to a chat with unread messages
        if (hasMessages && !hasUnreadMessages) return;

        setLoadingMessages(true);
        try {
            // All chats now use the unified PersonalChat endpoint
            const endpoint = `http://localhost:8080/api/messages/chat/${chatId}`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                const formattedMessages = messages.map(msg => ({
                    id: msg.messageId,
                    sender: msg.sender.id === (user.id || user.userId) ? 'You' : msg.sender.firstName + ' ' + msg.sender.lastName,
                    text: msg.content,
                    timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: msg.sender.id
                }));

                setChatMessages(prev => ({
                    ...prev,
                    [chatId]: formattedMessages
                }));

                // Update last message in conversations list if messages exist
                if (formattedMessages.length > 0) {
                    const lastMessage = formattedMessages[formattedMessages.length - 1];
                    setConversations(prevConversations =>
                        prevConversations.map(conv =>
                            conv.id === chatId
                                ? { ...conv, lastMessage: lastMessage.text }
                                : conv
                        )
                    );
                }
            } else {
                console.error('Failed to load messages for chat', chatId);
            }
        } catch (error) {
            console.error('Error loading chat messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Handle direct chat navigation from URL parameter
    useEffect(() => {
        const chatId = searchParams.get('chatId');
        if (chatId && conversations.length > 0) {
            const chatExists = conversations.find(conv => conv.id.toString() === chatId);
            if (chatExists && selectedChat !== parseInt(chatId)) {
                setSelectedChat(parseInt(chatId));
            }
        }
    }, [searchParams]);
    
    // Handle incoming chat notifications for conversation list updates
    useEffect(() => {
        if (chatNotifications.length > 0) {
            chatNotifications.forEach(notification => {
                if (notification.type === 'NEW_MESSAGE') {
                    // Update the conversation list with the new last message and unread count from backend
                    setConversations(prevConversations => 
                        prevConversations.map(conv => 
                            conv.id === notification.chatId 
                                ? { 
                                    ...conv, 
                                    lastMessage: notification.content,
                                    timestamp: new Date().toLocaleDateString(),
                                    // Use unread count from notification (calculated by backend)
                                    unreadCount: notification.chatId === selectedChat ? 0 : notification.unreadCount || 0
                                }
                                : conv
                        )
                    );
                    
                    // If notification is for the currently selected chat, automatically mark as read
                    if (notification.chatId === selectedChat) {
                        markChatAsRead(notification.chatId);
                    }
                    // Note: Global navbar update is now handled in App.jsx
                }
            });
            
            // Clear processed notifications
            clearChatNotifications();
        }
    }, [chatNotifications, clearChatNotifications]);

    // Handle sending a new message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;
        
        const messageText = newMessage;
        setNewMessage(''); // Clear input immediately
        
        // Try WebSocket first
        if (isConnected && sendWebSocketMessage(messageText)) {
            console.log('Message sent via WebSocket');
            // WebSocket will handle the message response, no need to add message manually
            return;
        }
        
        // Fallback to REST API only when WebSocket is not available
        console.log('WebSocket not available, falling back to REST API');
        try {
            const userId = user.id || user.userId;
            const response = await fetch(`http://localhost:8080/api/messages/chat/${selectedChat}/send?senderId=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: messageText })
            });
            
            if (response.ok) {
                const newMessage = await response.json();
                const formattedMessage = {
                    id: newMessage.messageId,
                    sender: 'You',
                    text: newMessage.content,
                    timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: newMessage.sender.id
                };
                
                // Add message to UI only for REST API (WebSocket handles this automatically)
                setChatMessages(prev => {
                    const currentMessages = prev[selectedChat] || [];
                    const existingIds = new Set(currentMessages.map(msg => msg.id));
                    
                    // Only add if not already exists (prevent duplicates)
                    if (!existingIds.has(formattedMessage.id)) {
                        // Update last message in conversations list
                        setConversations(prevConversations => 
                            prevConversations.map(conv => 
                                conv.id === selectedChat 
                                    ? { ...conv, lastMessage: formattedMessage.text }
                                    : conv
                            )
                        );
                        
                        return {
                            ...prev,
                            [selectedChat]: [...currentMessages, formattedMessage]
                        };
                    }
                    return prev;
                });
            } else {
                console.error('Failed to send message');
                setNewMessage(messageText); // Restore message if failed
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText); // Restore message if failed
        }
    };

    // Handle Enter key in input
    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleChatSelect = async (conversation) => {
        setSelectedChat(conversation.id);
        loadChatMessages(conversation.id);

        // Mark chat as read for both personal and trip chats
        await markChatAsRead(conversation.id);
    };
    
    const markChatAsRead = async (chatId) => {
        try {
            const userId = user.id || user.userId;
            const response = await fetch(`http://localhost:8080/api/personal-chats/${chatId}/mark-read?userId=${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                // Update local conversations to set unread count to 0
                setConversations(prevConversations =>
                    prevConversations.map(conv =>
                        conv.id === chatId
                            ? { ...conv, unreadCount: 0 }
                            : conv
                    )
                );

                // Notify that unread count has changed
                unreadCountManager.notifyCountChanged();
            }
        } catch (error) {
            console.error('Error marking chat as read:', error);
        }
    };

    const startNewAIChat = () => {
        // Handle starting new chat with Trippy AI
        console.log('Starting new chat with Trippy AI');
    };

    return (
        <div className="min-h-screen bg-neutrals-8">
            {/* Desktop Layout */}
            <div className="hidden lg:flex">
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
                </div>
                <div className="flex-1 w-full transition-all duration-300">
                    <Navbar
                        isAuthenticated={true}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={toggleSidebar}
                    />
                    <main className="flex h-[calc(100vh-64px)]">
                        {/* Conversations List Panel */}
                        <div className="w-80 bg-white border-r border-neutrals-6 flex flex-col">
                            {/* Header with search and new AI chat button */}
                            <div className="p-4 border-b border-neutrals-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-neutrals-1">Messages</h2>
                                </div>
                                <SearchBar />
                            </div>

                            {/* Start new AI chat button */}
                            <div className="p-4 border-b">
                                <AIChatButton onClick={startNewAIChat} />
                            </div>

                            {/* Conversations List */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-neutrals-4">
                                        Loading conversations...
                                    </div>
                                ) : conversations.length > 0 ? (
                                    <ConversationList
                                        conversations={conversations}
                                        selectedChat={selectedChat}
                                        onChatSelect={handleChatSelect}
                                    />
                                ) : (
                                    <EmptyState 
                                        title="No conversations yet"
                                        description="Start chatting with guides about experiences!"
                                        buttonText="Start chatting with Trippy AI"
                                        onButtonClick={startNewAIChat}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Chat Panel */}
                        <div className="flex-1 flex flex-col bg-neutrals-8 min-h-0">
                            {selectedChat ? (
                                // Chat interface for selected chat
                                <div className="flex-1 flex flex-col min-h-0">
                                    <ChatHeader conversation={selectedConversation} />
                                    {loadingMessages ? (
                                        <div className="flex-1 flex items-center justify-center bg-neutrals-8">
                                            <div className="text-neutrals-4">Loading messages...</div>
                                        </div>
                                    ) : (
                                        <>
                                            <MessageList messages={chatMessages[selectedChat] || []} isTripChannel={selectedConversation?.isTripChat} />
                                            <div className="px-4 pb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <span className="text-xs text-neutrals-4">
                                                            {isConnected ? 'Live chat connected' : 'Using standard messaging'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <MessageInput 
                                                    newMessage={newMessage}
                                                    setNewMessage={setNewMessage}
                                                    onSendMessage={handleSendMessage}
                                                    onKeyDown={handleInputKeyDown}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // No chat selected state
                                <EmptyState 
                                    isChat={true}
                                    title="Welcome to Messages"
                                    description="Select a conversation to start chatting"
                                    buttonText="Start chatting with Trippy AI"
                                    onButtonClick={startNewAIChat}
                                />
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full">
                <Navbar
                    isAuthenticated={true}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                <main className="w-full">
                    {/* If a chat is selected, show chat interface, else show conversation list */}
                    {selectedChat ? (
                        // Mobile Chat Interface
                        <div className="flex flex-col h-[calc(100vh-56px)] bg-neutrals-8 min-h-0">
                            <ChatHeader 
                                conversation={selectedConversation} 
                                onBack={() => setSelectedChat(null)}
                                showBackButton={true}
                            />
                            {loadingMessages ? (
                                <div className="flex-1 flex items-center justify-center bg-neutrals-8">
                                    <div className="text-neutrals-4">Loading messages...</div>
                                </div>
                            ) : (
                                <>
                                    <MessageList messages={chatMessages[selectedChat] || []} isTripChannel={selectedConversation?.isTripChat} />
                                    <div className="px-4 pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-xs text-neutrals-4">
                                                    {isConnected ? 'Live chat connected' : 'Using standard messaging'}
                                                </span>
                                            </div>
                                        </div>
                                        <MessageInput 
                                            newMessage={newMessage}
                                            setNewMessage={setNewMessage}
                                            onSendMessage={handleSendMessage}
                                            onKeyDown={handleInputKeyDown}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        // Mobile Conversation List
                        <>
                            {/* Mobile Header with AI Chat Button */}
                            <div className="p-4 bg-white border-b border-neutrals-6">
                                <h1 className="text-xl font-bold text-neutrals-1 mb-4">Messages</h1>
                                <AIChatButton onClick={startNewAIChat} size="small" />
                                <div className="mt-4">
                                    <SearchBar />
                                </div>
                            </div>
                            
                            {/* Mobile Conversations List */}
                            <div className="bg-neutrals-8">
                                {loading ? (
                                    <div className="p-4 text-center text-neutrals-4 bg-white">
                                        Loading conversations...
                                    </div>
                                ) : conversations.length > 0 ? (
                                    <div className="bg-white">
                                        <ConversationList
                                            conversations={conversations}
                                            selectedChat={selectedChat}
                                            onChatSelect={handleChatSelect}
                                            showMobileChevron={true}
                                        />
                                    </div>
                                ) : (
                                    <EmptyState 
                                        title="No conversations yet"
                                        description="Start chatting with guides about experiences!"
                                        buttonText="Start chatting with Trippy AI"
                                        onButtonClick={startNewAIChat}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MessagesPage;