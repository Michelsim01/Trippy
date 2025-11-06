import React from 'react'
import { User } from 'lucide-react'

const ChatbotMessage = ({ message }) => {
  const isUser = message.role === 'user'
  const isError = message.isError

  const formatContent = (content) => {
    // Handle undefined or null content
    if (!content) {
      return <p>No content</p>
    }

    // Split content by lines
    const lines = content.split('\n')

    return lines.map((line, index) => {
      // Check if line is a heading (starts with ###, ##, or #)
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-neutrals-1">
            {line.substring(4)}
          </h3>
        )
      } else if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-semibold mt-4 mb-2 text-neutrals-1">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-2 text-neutrals-1">
            {line.substring(2)}
          </h1>
        )
      }
      // Check if line is a bullet point
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={index} className="ml-4">
            {line.trim().substring(2)}
          </li>
        )
      }
      // Check if line is bold (wrapped in **)
      else if (line.includes('**')) {
        const parts = line.split('**')
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        )
      }
      // Regular paragraph
      else if (line.trim()) {
        return (
          <p key={index} className="mb-2">
            {line}
          </p>
        )
      }
      // Empty line
      else {
        return <br key={index} />
      }
    })
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 bg-primary-1 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] ml-auto">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="w-8 h-8 bg-neutrals-4 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 ${isError ? 'bg-red-500' : 'bg-primary-1'} rounded-full flex items-center justify-center flex-shrink-0`}>
        {isError ? (
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
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
        )}
      </div>
      <div className={`flex-1 ${isError ? 'bg-red-50 border border-red-200' : 'bg-neutrals-7'} rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]`}>
        <div className={`text-sm ${isError ? 'text-red-700' : 'text-neutrals-2'} whitespace-pre-wrap break-words`}>
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  )
}

export default ChatbotMessage
