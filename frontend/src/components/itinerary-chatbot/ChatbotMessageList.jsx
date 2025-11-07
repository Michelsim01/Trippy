import React, { useEffect, useRef } from 'react'
import ChatbotMessage from './ChatbotMessage'

const ChatbotMessageList = ({ messages, loading }) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  return (
    <div className="px-6 py-4 space-y-4">
      {messages.map((message, index) => (
        <ChatbotMessage
          key={index}
          message={message}
        />
      ))}

      {loading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-1 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <div className="flex-1 bg-neutrals-7 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neutrals-4 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-neutrals-4 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-neutrals-4 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatbotMessageList
