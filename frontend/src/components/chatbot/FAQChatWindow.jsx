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
  const [lastOptionsMessage, setLastOptionsMessage] = useState(null); // Store last message with numbered options
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    if (isOpen && user) {
      initializeSession();
    }
  }, [isOpen, user]);

  // Scroll to bottom when new messages are added or when sending (loading indicator)
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages.length, loading, sending]);

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

      // Get or create the most recent session for this user
      const sessionData = await faqChatService.createSession(userId);
      setSessionId(sessionData.sessionId);

      // Load existing messages if any
      const sessionHistory = await faqChatService.getSession(sessionData.sessionId);
      if (sessionHistory && sessionHistory.messages && sessionHistory.messages.length > 0) {
        // Messages are already in chronological order from backend
        // Interleave user and bot messages
        const formattedMessages = [];
        
        sessionHistory.messages.forEach((msg, index) => {
          // Add user message
          if (msg.userMessage) {
            formattedMessages.push({
              id: `user-${msg.timestamp}-${index}`,
              text: msg.userMessage,
              isUser: true,
              timestamp: formatTimestamp(msg.timestamp),
            });
          }
          
          // Add bot response immediately after user message
          if (msg.botResponse) {
            formattedMessages.push({
              id: `bot-${msg.timestamp}-${index}`,
              text: msg.botResponse,
              isUser: false,
              timestamp: formatTimestamp(msg.timestamp),
            });
          }
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending || !sessionId) return;

    let userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Check if user sent just a number (for selecting from numbered list)
    const numberMatch = userMessage.match(/^\s*(\d+)\s*\.?\s*$/);
    if (numberMatch && lastOptionsMessage) {
      const selectedNumber = parseInt(numberMatch[1]);
      // Extract the question from the numbered list
      const questionText = extractQuestionFromNumberedList(lastOptionsMessage.text, selectedNumber);
      if (questionText) {
        // Use the extracted question instead of just the number
        userMessage = questionText;
      }
    }

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

      // Check if this bot message contains a numbered list (options)
      if (hasNumberedList(response.response)) {
        setLastOptionsMessage(botMsg);
      } else {
        setLastOptionsMessage(null); // Clear if not an options message
      }
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

  // Extract question text from numbered list by number
  const extractQuestionFromNumberedList = (text, number) => {
    // Try multiple patterns to find the question
    // Pattern 1: "1. **Question**" or "1. Question" (single line)
    let pattern = new RegExp(`${number}[\.\)]\\s*\\*\\*([^*]+)\\*\\*`, 'i');
    let match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Pattern 2: "1. Question text" (may span multiple lines until next number or end)
    pattern = new RegExp(`${number}[\.\)]\\s*([^\\n]+(?:\\n(?!\\s*\\d+[\.\\)])[^\\n]+)*)`, 'i');
    match = text.match(pattern);
    if (match && match[1]) {
      // Clean up: remove markdown, trim, and collapse whitespace
      return match[1]
        .replace(/\*\*/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Pattern 3: Line-by-line search (more reliable for complex formatting)
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineMatch = line.match(new RegExp(`^${number}[\.\)]\\s*(.+)$`, 'i'));
      if (lineMatch) {
        let question = lineMatch[1].replace(/\*\*/g, '').trim();
        
        // Check if question continues on next lines (until next number or empty line)
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine.length === 0) break; // Empty line ends the question
          if (/^\d+[\.\)]\s+/.test(nextLine)) break; // Next number starts
          question += ' ' + nextLine.replace(/\*\*/g, '').trim();
        }
        
        return question.replace(/\s+/g, ' ').trim();
      }
    }

    return null;
  };

  // Check if message contains a numbered list
  const hasNumberedList = (text) => {
    // Check for patterns like "1.", "2.", etc. or "1)", "2)", etc.
    return /^\s*\d+[\.\)]\s+/.test(text) || /\n\s*\d+[\.\)]\s+/.test(text);
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
    
    // Check if message contains numbered list and format it nicely
    if (hasNumberedList(text)) {
      return renderNumberedList(text, renderTextWithLinks);
    }
    
    // No FAQ structure, just render with links
    return renderTextWithLinks(text);
  };

  // Render numbered list with proper formatting
  const renderNumberedList = (text, renderTextWithLinks) => {
    // First, try to find numbered list patterns in the text
    // Pattern: "1. text" or "1) text" or "1 text" (with optional markdown bold)
    const listPattern = /(\d+)[\.\)]\s*\*?([^*\n]+)\*?/g;
    const matches = [];
    let match;
    
    while ((match = listPattern.exec(text)) !== null) {
      matches.push({
        number: match[1],
        content: match[2].trim(),
        index: match.index,
        fullMatch: match[0]
      });
    }

    // If we found numbered items, format them nicely
    if (matches.length > 0) {
      const result = [];
      let lastIndex = 0;

      // Add text before the first list item
      if (matches[0].index > 0) {
        const beforeText = text.substring(0, matches[0].index).trim();
        if (beforeText) {
          result.push(
            <div key="before-list" className="mb-3 whitespace-pre-wrap">
              {renderTextWithLinks(beforeText)}
            </div>
          );
        }
      }

      // Render the numbered list
      result.push(
        <div key="numbered-list" className="my-3 space-y-2">
          {matches.map((item, idx) => (
            <div key={`item-${idx}`} className="flex items-start gap-2">
              <span className="font-semibold text-neutrals-1 flex-shrink-0 min-w-[1.5rem]">{item.number}.</span>
              <span className="flex-1">{renderTextWithLinks(item.content)}</span>
            </div>
          ))}
        </div>
      );

      // Add text after the last list item
      const lastMatchEnd = matches[matches.length - 1].index + matches[matches.length - 1].fullMatch.length;
      if (lastMatchEnd < text.length) {
        const afterText = text.substring(lastMatchEnd).trim();
        if (afterText) {
          result.push(
            <div key="after-list" className="mt-3 whitespace-pre-wrap">
              {renderTextWithLinks(afterText)}
            </div>
          );
        }
      }

      return <div className="space-y-2">{result}</div>;
    }

    // Fallback: if no matches found, try line-by-line parsing
    const lines = text.split('\n');
    const result = [];
    let beforeList = [];
    let listItems = [];
    let afterList = [];
    let foundList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const listMatch = trimmedLine.match(/^(\d+)[\.\)]\s*(.+)$/);
      
      if (listMatch) {
        foundList = true;
        if (beforeList.length > 0 && listItems.length === 0) {
          // First list item found, render what came before
          result.push(
            <div key={`before-${i}`} className="mb-3 whitespace-pre-wrap">
              {renderTextWithLinks(beforeList.join('\n'))}
            </div>
          );
          beforeList = [];
        }
        const number = listMatch[1];
        const content = listMatch[2].replace(/\*\*/g, '').trim();
        listItems.push({ number, content });
      } else if (foundList && trimmedLine.length === 0) {
        // Empty line - might be end of list or separator
        if (listItems.length > 0) {
          result.push(
            <div key={`list-${i}`} className="my-3 space-y-2">
              {listItems.map((item, idx) => (
                <div key={`item-${idx}`} className="flex items-start gap-2">
                  <span className="font-semibold text-neutrals-1 flex-shrink-0 min-w-[1.5rem]">{item.number}.</span>
                  <span className="flex-1">{renderTextWithLinks(item.content)}</span>
                </div>
              ))}
            </div>
          );
          listItems = [];
          foundList = false;
        }
        afterList.push(lines[i]);
      } else if (foundList && listItems.length > 0) {
        // Continuation of current list item
        listItems[listItems.length - 1].content += ' ' + trimmedLine;
      } else if (!foundList) {
        beforeList.push(lines[i]);
      } else {
        afterList.push(lines[i]);
      }
    }

    // Handle remaining list items
    if (listItems.length > 0) {
      result.push(
        <div key="list-final" className="my-3 space-y-2">
          {listItems.map((item, idx) => (
            <div key={`item-${idx}`} className="flex items-start gap-2">
              <span className="font-semibold text-neutrals-1 flex-shrink-0 min-w-[1.5rem]">{item.number}.</span>
              <span className="flex-1">{renderTextWithLinks(item.content)}</span>
            </div>
          ))}
        </div>
      );
    }

    // Add remaining text
    if (afterList.length > 0) {
      const afterText = afterList.join('\n').trim();
      if (afterText) {
        result.push(
          <div key="after" className="mt-3 whitespace-pre-wrap">
            {renderTextWithLinks(afterText)}
          </div>
        );
      }
    }

    return result.length > 0 ? <div className="space-y-2">{result}</div> : renderTextWithLinks(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[500px] h-[800px] bg-white rounded-lg shadow-2xl flex flex-col z-[10001] border border-neutrals-6">
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
          <>
            {messages.map((message) => (
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
            ))}
            {/* Loading indicator when waiting for bot response */}
            {sending && (
              <div className="flex items-start justify-start">
                <div className="max-w-[80%] bg-white border border-neutrals-6 rounded-lg rounded-tl-none px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neutrals-4 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutrals-4 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-neutrals-4 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
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

