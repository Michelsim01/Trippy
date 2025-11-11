import React, { useState, useEffect } from 'react'
import ChatbotHeader from './ChatbotHeader'
import ChatbotMessageList from './ChatbotMessageList'
import ChatbotInput from './ChatbotInput'
import ChatbotSuggestions from './ChatbotSuggestions'
import ChatbotSidebar from './ChatbotSidebar'
import TripDetailsForm from './TripDetailsForm'
import itineraryChatbotService from '../../services/itineraryChatbotService'

const ChatbotModal = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showTripForm, setShowTripForm] = useState(true)
  const [allSessions, setAllSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load user's sessions
      loadUserSessions()

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

  const loadUserSessions = async () => {
    try {
      setLoadingSessions(true)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.id) {
        console.error('No user ID found')
        return
      }

      const result = await itineraryChatbotService.getUserSessions(user.id)
      if (result.success && result.data) {
        setAllSessions(result.data)
      }
    } catch (err) {
      console.error('Error loading user sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const createNewSession = () => {
    const newSessionId = itineraryChatbotService.generateSessionId()
    setSessionId(newSessionId)
    localStorage.setItem('itineraryChatSessionId', newSessionId)
    setMessages([])
    setShowSuggestions(true)
    setShowTripForm(true) // Show trip form for new sessions
    setError(null)
  }

  const handleNewTrip = () => {
    createNewSession()
    loadUserSessions() // Refresh session list
  }

  const handleSessionSelect = async (sid) => {
    if (sid === sessionId) return // Already on this session
    localStorage.setItem('itineraryChatSessionId', sid)
    await loadSessionHistory(sid)
  }

  const handleDeleteSession = async (sid) => {
    try {
      const result = await itineraryChatbotService.deleteSession(sid)
      if (result.success) {
        // If deleting active session, create new one
        if (sid === sessionId) {
          createNewSession()
        }
        // Refresh session list
        await loadUserSessions()
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  const loadSessionHistory = async (sid) => {
    try {
      setLoading(true)
      const result = await itineraryChatbotService.getSessionHistory(sid)

      if (result.success && result.data) {
        setSessionId(sid)

        // Transform backend message format to frontend format
        const transformedMessages = []
        if (result.data.messages && result.data.messages.length > 0) {
          result.data.messages.forEach(msg => {
            // Add user message
            if (msg.userMessage) {
              transformedMessages.push({
                role: 'user',
                content: msg.userMessage,
                timestamp: msg.timestamp
              })
            }
            // Add bot response
            if (msg.botResponse) {
              transformedMessages.push({
                role: 'assistant',
                content: msg.botResponse,
                timestamp: msg.timestamp
              })
            }
          })
        }

        setMessages(transformedMessages)
        setShowSuggestions(transformedMessages.length === 0)
        setShowTripForm(transformedMessages.length === 0) // Show form only for empty sessions
        setError(null)
      } else if (result.notFound) {
        // Session not found in backend, but keep the session ID
        // It will be created when the first message is sent
        console.log('Session not yet created on backend, keeping session ID:', sid)
        setSessionId(sid)
        setMessages([])
        setShowSuggestions(true)
        setShowTripForm(true) // Show form for new sessions
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

  const handleTripFormSubmit = (formattedPrompt) => {
    // Hide the form and send the formatted prompt
    setShowTripForm(false)
    handleSendMessage(formattedPrompt)
  }

  const handleSendMessage = async (message) => {
    if (!message.trim() || !sessionId) return

    // Hide suggestions and form once user starts chatting
    setShowSuggestions(false)
    setShowTripForm(false)

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

      {/* Modal with Sidebar */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden">
        {/* Sidebar */}
        <ChatbotSidebar
          sessions={allSessions}
          activeSessionId={sessionId}
          onSessionSelect={handleSessionSelect}
          onNewTrip={handleNewTrip}
          onDeleteSession={handleDeleteSession}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatbotHeader
            onClose={handleClose}
            onNewChat={handleNewTrip}
          />

          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && showTripForm ? (
              <TripDetailsForm onSubmit={handleTripFormSubmit} />
            ) : messages.length === 0 && showSuggestions ? (
              <ChatbotSuggestions onSuggestionClick={handleSuggestionClick} />
            ) : (
              <ChatbotMessageList
                messages={messages}
                loading={loading}
              />
            )}
          </div>

          {!showTripForm && (
            <ChatbotInput
              onSendMessage={handleSendMessage}
              disabled={loading}
            />
          )}

          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatbotModal
