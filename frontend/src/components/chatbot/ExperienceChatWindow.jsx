import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import experienceChatbotService from '../../services/experienceChatbotService';
import { useAuth } from '../../contexts/AuthContext';

const ExperienceChatWindow = ({ isOpen, onClose }) => {
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

      // Create a new session via backend
      console.log('Creating session for user:', userId);
      const sessionData = await experienceChatbotService.createSession(userId);
      console.log('Session created:', sessionData);
      setSessionId(sessionData.sessionId);

      // Load existing messages if any
      const sessionHistory = await experienceChatbotService.getSessionHistory(sessionData.sessionId);
      if (sessionHistory && sessionHistory.messages && sessionHistory.messages.length > 0) {
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
            recommendations: msg.recommendations || null,
          }))
        );
        setMessages(formattedMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        ));
      } else {
        // Add welcome message for new sessions
        const welcomeMsg = {
          id: `welcome-${Date.now()}`,
          text: "Hi! I'm your Experience Recommender. I can help you find personalized experiences based on your preferences. What kind of experience are you looking for?",
          isUser: false,
          timestamp: formatTimestamp(new Date()),
        };
        setMessages([welcomeMsg]);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      console.error('Error details:', error.response?.data || error.message);
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
      const response = await experienceChatbotService.sendMessage(userMessage, sessionId, null, userId);

      // Add bot response
      const botMsg = {
        id: `bot-${Date.now()}`,
        text: response.response || response.message,
        isUser: false,
        timestamp: formatTimestamp(response.timestamp || new Date()),
        recommendations: response.recommendations || null,
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

  // Parse markdown formatting
  const parseMarkdown = (text) => {
    // First handle markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkRegex);
    
    const elements = [];
    for (let i = 0; i < parts.length; i += 3) {
      const textPart = parts[i];
      const linkText = parts[i + 1];
      const linkUrl = parts[i + 2];
      
      if (textPart) {
        // Parse bold formatting in text parts
        const boldParts = textPart.split(/(\*\*.*?\*\*)/g);
        boldParts.forEach((boldPart, boldIndex) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            const boldText = boldPart.slice(2, -2);
            elements.push(<strong key={`${i}-bold-${boldIndex}`} className="font-semibold">{boldText}</strong>);
          } else if (boldPart) {
            elements.push(<span key={`${i}-text-${boldIndex}`}>{boldPart}</span>);
          }
        });
      }
      
      if (linkText && linkUrl) {
        elements.push(
          <button
            key={`${i}-link`}
            onClick={() => navigate(linkUrl)}
            className="text-primary-4 hover:text-primary-3 underline cursor-pointer font-medium inline"
          >
            {linkText}
          </button>
        );
      }
    }
    
    return elements.length > 0 ? elements : text;
  };

  // Render message with experience recommendations
  const renderMessage = (message) => {
    const { text, recommendations } = message;
    
    return (
      <div className="space-y-2">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {parseMarkdown(text)}
        </div>
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-2 mt-3">
            <div className="text-xs font-semibold text-neutrals-3 uppercase tracking-wide">
              Recommended Experiences:
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="bg-neutrals-8 border border-neutrals-6 rounded-lg p-3 cursor-pointer hover:bg-neutrals-7 transition-colors"
                  onClick={() => navigate(`/experience/${rec.id}`)}
                >
                  <div className="font-medium text-sm text-neutrals-1">{rec.title}</div>
                  {rec.location && (
                    <div className="text-xs text-neutrals-4 mt-1">{rec.location}</div>
                  )}
                  {rec.price && (
                    <div className="text-xs text-primary-1 font-medium mt-1">
                      ${rec.price}
                    </div>
                  )}
                  {rec.rating && (
                    <div className="text-xs text-neutrals-4 mt-1">
                      ⭐ {rec.rating}/5
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[500px] h-[800px] bg-white rounded-lg shadow-2xl flex flex-col z-[10001] border border-neutrals-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutrals-6 bg-primary-4 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <h3 className="font-semibold">Experience Recommender</h3>
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
            <Loader2 className="w-6 h-6 animate-spin text-primary-4" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-neutrals-4 text-sm py-8">
            <p>Tell me what kind of experience you're looking for!</p>
            <p className="mt-2 text-xs">I'll provide personalized recommendations just for you.</p>
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
                    ? 'bg-primary-4 text-white'
                    : 'bg-white text-neutrals-1 border border-neutrals-6'
                }`}
              >
                <div className="text-sm">
                  {message.isUser ? (
                    <p>{message.text}</p>
                  ) : (
                    renderMessage(message)
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
            placeholder="Describe your ideal experience..."
            className="flex-1 border border-neutrals-6 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-4"
            disabled={sending || loading || !sessionId}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sending || loading || !sessionId}
            className="bg-primary-4 hover:bg-primary-3 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

export default ExperienceChatWindow;