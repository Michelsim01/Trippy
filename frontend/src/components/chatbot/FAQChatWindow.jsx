import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { faqChatService } from '../../services/faqChatService';
import { useAuth } from '../../contexts/AuthContext';

const FAQChatWindow = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    if (isOpen && user) {
      initializeSession();
    }
  }, [isOpen, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when window opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.userId;
      
      if (!userId) {
        console.error('User ID not available');
        return;
      }

      // Try to get existing session or create new one
      const sessionData = await faqChatService.createSession(userId);
      setSessionId(sessionData.sessionId);

      // Load existing messages if any
      const sessionHistory = await faqChatService.getSession(sessionData.sessionId);
      if (sessionHistory && sessionHistory.messages) {
        const formattedMessages = sessionHistory.messages.map(msg => ({
          id: `msg-${msg.timestamp}`,
          text: msg.userMessage,
          isUser: true,
          timestamp: formatTimestamp(msg.timestamp),
        })).concat(
          sessionHistory.messages.map(msg => ({
            id: `bot-${msg.timestamp}`,
            text: msg.botResponse,
            isUser: false,
            timestamp: formatTimestamp(msg.timestamp),
          }))
        );
        setMessages(formattedMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        ));
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending || !sessionId) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Add user message to UI immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      text: userMessage,
      isUser: true,
      timestamp: formatTimestamp(new Date()),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const userId = user?.id || user?.userId;
      const response = await faqChatService.sendMessage(sessionId, userMessage, userId);

      // Add bot response
      const botMsg = {
        id: `bot-${Date.now()}`,
        text: response.response,
        isUser: false,
        timestamp: formatTimestamp(response.timestamp || new Date()),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: formatTimestamp(new Date()),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message with markdown-style links and formatted FAQ structure
  const renderMessage = (text) => {
    if (!text) return text;

    // Helper function to render text with links
    const renderTextWithLinks = (content) => {
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const elements = [];
      let lastIndex = 0;
      let match;
      let linkIndex = 0;

      while ((match = linkPattern.exec(content)) !== null) {
        // Add text before link
        if (match.index > lastIndex) {
          elements.push(
            <span key={`text-${linkIndex}`}>
              {content.substring(lastIndex, match.index)}
            </span>
          );
        }
        
        // Add link
        elements.push(
          <button
            key={`link-${linkIndex}`}
            onClick={() => navigate(match[2])}
            className="text-primary-1 hover:text-primary-2 underline font-medium"
          >
            {match[1]}
          </button>
        );
        
        lastIndex = match.index + match[0].length;
        linkIndex++;
      }
      
      // Add remaining text
      if (lastIndex < content.length) {
        elements.push(
          <span key="text-end">{content.substring(lastIndex)}</span>
        );
      }
      
      return elements.length > 0 ? <>{elements}</> : <span>{content}</span>;
    };

    // Check if it's formatted as Question: ... Answer: ...
    if (text.includes('**Question:**') || text.includes('**Answer:**')) {
      const questionMatch = text.match(/\*\*Question:\*\*\s*(.+?)(?:\n\n\*\*Answer:\*\*|$)/s);
      const answerMatch = text.match(/\*\*Answer:\*\*\s*(.+?)$/s);
      
      if (questionMatch || answerMatch) {
        return (
          <div className="space-y-2">
            {questionMatch && (
              <div>
                <span className="font-semibold">Question: </span>
                <span>{renderTextWithLinks(questionMatch[1].trim())}</span>
              </div>
            )}
            {answerMatch && (
              <div>
                <span className="font-semibold">Answer: </span>
                <span className="whitespace-pre-wrap">{renderTextWithLinks(answerMatch[1].trim())}</span>
              </div>
            )}
          </div>
        );
      }
    }
    
    // No FAQ structure, just render with links
    return renderTextWithLinks(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-[10001] border border-neutrals-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutrals-6 bg-primary-1 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <h3 className="font-semibold">FAQ Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutrals-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary-1" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-neutrals-4 text-sm py-8">
            <p>Ask me anything about our FAQs!</p>
            <p className="mt-2 text-xs">I'll help you find answers to common questions.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'bg-primary-1 text-white'
                    : 'bg-white text-neutrals-1 border border-neutrals-6'
                }`}
              >
                <div className="text-sm">
                  {message.isUser ? (
                    <p>{message.text}</p>
                  ) : (
                    renderMessage(message.text)
                  )}
                </div>
                <p className={`text-xs mt-1 ${message.isUser ? 'text-white/70' : 'text-neutrals-4'}`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutrals-6 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 border border-neutrals-6 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-1"
            disabled={sending || loading || !sessionId}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sending || loading || !sessionId}
            className="bg-primary-1 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQChatWindow;

