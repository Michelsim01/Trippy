import React, { useState } from 'react'
import { Trash2, MessageSquare } from 'lucide-react'

const ChatbotSessionItem = ({ session, isActive, onClick, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Generate title from first message or use default
  const getTitle = () => {
    if (session.title) {
      return session.title
    }
    if (session.messages && session.messages.length > 0) {
      const firstMessage = session.messages[0].userMessage || 'New Trip'
      // Truncate to 40 characters
      return firstMessage.length > 40
        ? firstMessage.substring(0, 40) + '...'
        : firstMessage
    }
    return 'New Trip'
  }

  // Format last activity time
  const getLastActivity = () => {
    if (!session.createdAt) return ''
    const date = new Date(session.createdAt)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (showDeleteConfirm) {
      onDelete()
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  const handleCancelDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-lg cursor-pointer transition-all mb-2 ${
        isActive
          ? 'bg-primary-1 text-white'
          : 'bg-white hover:bg-neutrals-7 text-neutrals-1'
      }`}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-neutrals-4'}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-neutrals-1'}`}>
            {getTitle()}
          </div>
          <div className={`text-xs mt-1 ${isActive ? 'text-white opacity-80' : 'text-neutrals-4'}`}>
            {getLastActivity()}
          </div>
        </div>
        {!showDeleteConfirm ? (
          <button
            onClick={handleDelete}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-neutrals-5 ${
              isActive ? 'hover:bg-white hover:bg-opacity-20' : ''
            }`}
            title="Delete trip"
          >
            <Trash2 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutrals-4'}`} />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-2 py-1 text-xs bg-neutrals-5 text-neutrals-2 rounded hover:bg-neutrals-4"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatbotSessionItem
