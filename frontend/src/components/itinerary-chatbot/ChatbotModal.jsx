import React, { useState, useEffect } from 'react'
import ChatbotHeader from './ChatbotHeader'
import ChatbotMessageList from './ChatbotMessageList'
import ChatbotInput from './ChatbotInput'
import ChatbotSuggestions from './ChatbotSuggestions'
import itineraryChatbotService from '../../services/itineraryChatbotService'

const ChatbotModal = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  useEffect(() => {
    if (isOpen) {
      // Load or create session
      const storedSessionId = localStorage.getItem('itineraryChatSessionId')
      if (storedSessionId) {
        loadSessionHistory(storedSessionId)
      } else {
        createNewSession()
      }

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const createNewSession = () => {
    const newSessionId = itineraryChatbotService.generateSessionId()
    setSessionId(newSessionId)
    localStorage.setItem('itineraryChatSessionId', newSessionId)
    setMessages([])
    setShowSuggestions(true)
    setError(null)
  }

  const loadSessionHistory = async (sid) => {
    try {
      setLoading(true)
      const result = await itineraryChatbotService.getSessionHistory(sid)

      if (result.success && result.data) {
        setSessionId(sid)
        setMessages(result.data.messages || [])
        setShowSuggestions(result.data.messages?.length === 0)
        setError(null)
      } else if (result.notFound) {
        // Session not found in backend, but keep the session ID
        // It will be created when the first message is sent
        console.log('Session not yet created on backend, keeping session ID:', sid)
        setSessionId(sid)
        setMessages([])
        setShowSuggestions(true)
        setError(null)
      } else {
        setError(result.error)
        createNewSession()
      }
    } catch (err) {
      console.error('Error loading session:', err)
      createNewSession()
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (message) => {
    if (!message.trim() || !sessionId) return

    // Hide suggestions once user starts chatting
    setShowSuggestions(false)

    // Add user message to UI
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setError(null)

    try {
      const result = await itineraryChatbotService.sendMessage(sessionId, message)

      if (result.success && result.data) {
        // Add AI response to UI
        const aiMessage = {
          role: 'assistant',
          content: result.data.response,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
      } else {
        setError(result.error || 'Failed to send message')

        // Add error message to UI
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true,
        }

        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')

      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    createNewSession()
  }

  const handleClose = () => {
    onClose()
  }

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <ChatbotHeader
          onClose={handleClose}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && showSuggestions ? (
            <ChatbotSuggestions onSuggestionClick={handleSuggestionClick} />
          ) : (
            <ChatbotMessageList
              messages={messages}
              loading={loading}
            />
          )}
        </div>

        <ChatbotInput
          onSendMessage={handleSendMessage}
          disabled={loading}
        />

        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatbotModal
