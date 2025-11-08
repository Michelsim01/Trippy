import React from 'react'
import { Plus } from 'lucide-react'
import ChatbotSessionItem from './ChatbotSessionItem'

const ChatbotSidebar = ({ sessions, activeSessionId, onSessionSelect, onNewTrip, onDeleteSession }) => {
  return (
    <div className="w-64 bg-neutrals-8 border-r border-neutrals-6 flex flex-col h-full">
      {/* Header with New Trip button */}
      <div className="p-4 border-b border-neutrals-6">
        <button
          onClick={onNewTrip}
          className="w-full flex items-center justify-center gap-2 bg-primary-1 text-white rounded-lg px-4 py-3 hover:bg-primary-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Trip
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions && sessions.length > 0 ? (
          <div className="p-2">
            {sessions.map((session) => (
              <ChatbotSessionItem
                key={session.sessionId}
                session={session}
                isActive={session.sessionId === activeSessionId}
                onClick={() => onSessionSelect(session.sessionId)}
                onDelete={() => onDeleteSession(session.sessionId)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-neutrals-4 text-sm">
            No trips yet. Start a new trip to begin planning!
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutrals-6 text-xs text-neutrals-4 text-center">
        Your trip history
      </div>
    </div>
  )
}

export default ChatbotSidebar
