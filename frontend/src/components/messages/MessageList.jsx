import React, { useEffect, useRef, useState } from 'react';

// Function to generate consistent dynamic color for a sender name
const getSenderColor = (senderName) => {
  // Create a hash from the sender name to ensure consistent color assignment
  let hash = 0;
  for (let i = 0; i < senderName.length; i++) {
    hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use hash to generate HSL values
  // Hue: 0-360 degrees (full color spectrum)
  const hue = Math.abs(hash) % 360;
  
  // Saturation: 65-85% (vibrant but not too saturated)
  const saturation = 65 + (Math.abs(hash >> 8) % 21);
  
  // Lightness: 35-55% (dark enough to read on white background)
  const lightness = 35 + (Math.abs(hash >> 16) % 21);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const MessageItem = ({ message, isTripChannel }) => {
  const isOutgoing = message.sender === 'You';
  const senderColor = getSenderColor(message.sender);
  
  return (
    <div key={message.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm text-sm ${isOutgoing ? 'bg-primary-4 text-white' : 'bg-white text-neutrals-1 border border-neutrals-6'}`}>
        {!isOutgoing && isTripChannel && (
          <div className="text-xs font-medium mb-1" style={{ color: senderColor }}>{message.sender}</div>
        )}
        <div>{message.text}</div>
        <div className={`text-xs mt-1 text-right ${isOutgoing ? 'text-white' : 'text-neutrals-4'}`}>{message.timestamp}</div>
      </div>
    </div>
  );
};

const MessageList = ({ messages, isTripChannel = false }) => {
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const isInitialLoad = useRef(true);

  const scrollToBottom = (force = false, instant = false) => {
    if (messagesEndRef.current && (force || isUserNearBottom)) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: instant ? 'instant' : 'smooth' 
      });
      setShowNewMessageIndicator(false);
    }
  };

  const checkIfNearBottom = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const threshold = 100; // pixels from bottom
      const nearBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsUserNearBottom(nearBottom);
      
      if (nearBottom) {
        setShowNewMessageIndicator(false);
      }
    }
  };

  // Handle scroll events to track if user is near bottom
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', checkIfNearBottom);
      return () => scrollArea.removeEventListener('scroll', checkIfNearBottom);
    }
  }, []);

  // Handle new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const newMessages = messages.slice(prevMessagesLength.current);
      const hasNewUserMessage = newMessages.some(msg => msg.sender === 'You');
      
      if (isInitialLoad.current && messages.length > 0) {
        // First time loading messages - scroll instantly to bottom
        scrollToBottom(true, true);
        isInitialLoad.current = false;
      } else if (hasNewUserMessage) {
        // Always scroll smoothly for user's own messages
        scrollToBottom(true);
      } else if (isUserNearBottom) {
        // Auto-scroll smoothly for incoming messages only if user is near bottom
        scrollToBottom();
      } else {
        // Show indicator for incoming messages when user is scrolled up
        setShowNewMessageIndicator(true);
      }
    } else if (messages.length === 0) {
      // Reset initial load flag when messages are cleared (e.g., switching chats)
      isInitialLoad.current = true;
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isUserNearBottom]);

  // Reset initial load flag when chat changes (messages array changes completely)
  useEffect(() => {
    isInitialLoad.current = true;
    prevMessagesLength.current = 0;
  }, [messages]); // This will trigger when the messages reference changes

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} isTripChannel={isTripChannel} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* New message indicator */}
      {showNewMessageIndicator && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => scrollToBottom(true)}
            className="bg-primary-4 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 hover:bg-primary-5 transition-colors"
          >
            <span>New message</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageList;