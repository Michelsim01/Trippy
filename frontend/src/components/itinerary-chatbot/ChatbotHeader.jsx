import React from 'react'
import { X, RotateCcw } from 'lucide-react'

const ChatbotHeader = ({ onClose, onNewChat }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutrals-6 bg-gradient-to-r from-primary-1 to-primary-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg
            className="w-6 h-6 text-primary-1"
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
        <div>
          <h2 className="text-lg font-semibold text-white">AI Trip Planner</h2>
          <p className="text-xs text-white text-opacity-90">
            Plan your perfect itinerary
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          title="Start new conversation"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  )
}

export default ChatbotHeader
