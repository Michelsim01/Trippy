import React, { useState } from 'react';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    
    // Mock chat messages per conversation
    const [chatMessages, setChatMessages] = useState({
        1: [
            { id: 1, sender: 'You', text: 'Hi! Is this tour available?', timestamp: '7:18 PM' },
            { id: 2, sender: 'Host', text: 'Yes, it is! Do you have any questions?', timestamp: '7:19 PM' },
        ],
        2: [
            { id: 1, sender: 'You', text: 'Hello! Can I get more info?', timestamp: 'Yesterday' },
            { id: 2, sender: 'Host', text: 'Of course! What would you like to know?', timestamp: 'Yesterday' },
        ],
    });

    // Mock conversation data - replace with real data from your API
    const conversations = [
        {
            id: 1,
            title: "Venice, Rome & Milan Tour",
            lastMessage: "When do you release the coded...",
            timestamp: "7:17 PM",
            participants: "2 guests",
            activity: "Airplane",
            avatar: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            unread: false
        },
        {
            id: 2,
            title: "Venice, Rome & Milan Tour",
            lastMessage: "When do you release the coded...",
            timestamp: "Yesterday",
            participants: "2 guests",
            activity: "Airplane",
            avatar: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            unread: false
        },
    ];

    // Handle sending a new message
    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedChat) return;
        setChatMessages(prev => ({
            ...prev,
            [selectedChat]: [
                ...(prev[selectedChat] || []),
                {
                    id: Date.now(),
                    sender: 'You',
                    text: newMessage,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]
        }));
        setNewMessage('');
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
                                {conversations.length > 0 ? (
                                    <ConversationList 
                                        conversations={conversations} 
                                        selectedChat={selectedChat}
                                        onChatSelect={handleChatSelect}
                                    />
                                ) : (
                                    <EmptyState 
                                        title="No conversations yet"
                                        description="Start chatting with Trippy AI or other travelers!"
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
                                    <MessageList messages={chatMessages[selectedChat] || []} />
                                    <MessageInput 
                                        newMessage={newMessage}
                                        setNewMessage={setNewMessage}
                                        onSendMessage={handleSendMessage}
                                        onKeyDown={handleInputKeyDown}
                                    />
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
                            <MessageList messages={chatMessages[selectedChat] || []} />
                            <MessageInput 
                                newMessage={newMessage}
                                setNewMessage={setNewMessage}
                                onSendMessage={handleSendMessage}
                                onKeyDown={handleInputKeyDown}
                            />
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
                                {conversations.length > 0 ? (
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
                                        description="Start chatting with Trippy AI or other travelers!"
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