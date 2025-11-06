import React, { useState } from 'react'
import { Send } from 'lucide-react'

const ChatbotInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (input.trim() && !disabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-neutrals-6 bg-white px-6 py-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to plan your perfect trip..."
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 border border-neutrals-6 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent disabled:bg-neutrals-7 disabled:cursor-not-allowed text-sm"
            style={{
              minHeight: '48px',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <p className="text-xs text-neutrals-4 mt-1 px-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-primary-1 text-white px-6 py-3 rounded-xl hover:bg-primary-2 transition-colors disabled:bg-neutrals-5 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatbotInput
