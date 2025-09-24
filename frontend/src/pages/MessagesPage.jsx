import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    const [selectedChat, setSelectedChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState({});
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Load user chats on component mount
    useEffect(() => {
        const loadUserChats = async () => {
            if (!user) return;
            
            try {
                const userId = user.id || user.userId;
                const response = await fetch(`http://localhost:8080/api/personal-chats/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const chats = await response.json();
                    const formattedConversations = chats.map(chat => {
                        // Get participant names from chat members
                        const currentUserId = user.id || user.userId;
                        const otherParticipant = chat.chatMembers?.find(member => member.user.id !== currentUserId);
                        const participantName = otherParticipant ? 
                            `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}` : 
                            "Guide";
                        
                        return {
                            id: chat.personalChatId,
                            title: chat.experience?.title || chat.name,
                            lastMessage: "Start chatting...", // TODO: Get last message
                            timestamp: new Date(chat.createdAt).toLocaleDateString(),
                            participants: `You & ${participantName}`,
                            activity: chat.experience?.category || "Experience",
                            avatar: chat.experience?.coverPhotoUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                            unread: false,
                            experience: chat.experience,
                            chatMembers: chat.chatMembers
                        };
                    });
                    setConversations(formattedConversations);
                } else {
                    console.error('Failed to load chats');
                }
            } catch (error) {
                console.error('Error loading chats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserChats();
    }, [user]);

    // Load messages for a specific chat
    const loadChatMessages = async (chatId) => {
        if (chatMessages[chatId]) return; // Already loaded
        
        setLoadingMessages(true);
        try {
            const response = await fetch(`http://localhost:8080/api/messages/chat/${chatId}`, {
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
            if (chatExists) {
                setSelectedChat(parseInt(chatId));
            }
        }
    }, [searchParams, conversations]);

    // Handle sending a new message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;
        
        const messageText = newMessage;
        setNewMessage(''); // Clear input immediately
        
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
                
                setChatMessages(prev => ({
                    ...prev,
                    [selectedChat]: [
                        ...(prev[selectedChat] || []),
                        formattedMessage
                    ]
                }));
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

    const handleChatSelect = (chatId) => {
        setSelectedChat(chatId);
        loadChatMessages(chatId);
    };

    const startNewAIChat = () => {
        // Handle starting new chat with Trippy AI
        console.log('Starting new chat with Trippy AI');
    };

    const selectedConversation = conversations.find(c => c.id === selectedChat);

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
                        <div className="flex-1 flex flex-col bg-neutrals-8">
                            {selectedChat ? (
                                // Chat interface for selected chat
                                <div className="flex-1 flex flex-col h-full">
                                    <ChatHeader conversation={selectedConversation} />
                                    {loadingMessages ? (
                                        <div className="flex-1 flex items-center justify-center bg-neutrals-8">
                                            <div className="text-neutrals-4">Loading messages...</div>
                                        </div>
                                    ) : (
                                        <>
                                            <MessageList messages={chatMessages[selectedChat] || []} />
                                            <MessageInput 
                                                newMessage={newMessage}
                                                setNewMessage={setNewMessage}
                                                onSendMessage={handleSendMessage}
                                                onKeyDown={handleInputKeyDown}
                                            />
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
                        <div className="flex flex-col h-[calc(100vh-56px)] bg-neutrals-8">
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
                                    <MessageList messages={chatMessages[selectedChat] || []} />
                                    <MessageInput 
                                        newMessage={newMessage}
                                        setNewMessage={setNewMessage}
                                        onSendMessage={handleSendMessage}
                                        onKeyDown={handleInputKeyDown}
                                    />
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