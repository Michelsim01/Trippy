import React, { useState, useEffect } from 'react'
import { MapPin, Calendar, Heart, Zap, Coffee, Mountain } from 'lucide-react'
import itineraryChatbotService from '../../services/itineraryChatbotService'

const ChatbotSuggestions = ({ onSuggestionClick }) => {
  const [suggestions, setSuggestions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      const result = await itineraryChatbotService.getSuggestions()

      if (result.success && result.data) {
        setSuggestions(result.data.suggestions || [])
        setCategories(result.data.categories || [])
      }
    } catch (err) {
      console.error('Error loading suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Multi-day Trips':
        return <Calendar className="w-5 h-5" />
      case 'Day Trips':
        return <MapPin className="w-5 h-5" />
      case 'Activities':
        return <Zap className="w-5 h-5" />
      case 'Food & Culture':
        return <Coffee className="w-5 h-5" />
      case 'Adventure':
        return <Mountain className="w-5 h-5" />
      case 'Romantic':
        return <Heart className="w-5 h-5" />
      default:
        return <MapPin className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1"></div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-1 to-primary-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-9 h-9 text-white"
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
          <h2 className="text-2xl font-bold text-neutrals-1 mb-2">
            Plan Your Perfect Trip
          </h2>
          <p className="text-neutrals-4 text-sm">
            Tell me what you're looking for and I'll help you create an amazing itinerary
            with the best experiences, routes, and timing.
          </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutrals-3 mb-3">
              Popular Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-neutrals-7 rounded-lg text-sm text-neutrals-2"
                >
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutrals-3 mb-3">
              Try asking me:
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="text-left px-4 py-3 bg-white border border-neutrals-6 rounded-xl hover:border-primary-1 hover:bg-primary-1 hover:bg-opacity-5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 text-neutrals-4 group-hover:text-primary-1 transition-colors">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-neutrals-2 group-hover:text-primary-1 transition-colors">
                      {suggestion}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-800">
            <strong>Tips:</strong> Be specific about your dates, interests, and preferences.
            I can suggest experiences, plan day-by-day itineraries, recommend routes, and check
            availability for you!
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatbotSuggestions
