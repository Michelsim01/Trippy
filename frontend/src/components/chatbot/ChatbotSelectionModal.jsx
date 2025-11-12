import React from 'react';
import { X, MessageSquare, Sparkles, Map } from 'lucide-react';

const ChatbotSelectionModal = ({ isOpen, onClose, onSelectFAQ, onSelectExperience, onSelectItinerary }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
          <h3 className="text-lg font-semibold text-neutrals-1">Select a Chatbot</h3>
          <button
            onClick={onClose}
            className="text-neutrals-4 hover:text-neutrals-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* FAQ Chatbot Option */}
          <button
            onClick={() => {
              onSelectFAQ();
              onClose();
            }}
            className="w-full p-4 border-2 border-neutrals-6 hover:border-primary-1 rounded-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 bg-primary-1/10 rounded-full flex items-center justify-center group-hover:bg-primary-1/20 transition-colors">
              <MessageSquare className="w-6 h-6 text-primary-1" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-neutrals-1">FAQ AI Chatbot</h4>
              <p className="text-sm text-neutrals-4">Get answers to frequently asked questions</p>
            </div>
          </button>

          {/* Experience Recommender Option */}
          <button
            onClick={() => {
              onSelectExperience();
              onClose();
            }}
            className="w-full p-4 border-2 border-neutrals-6 hover:border-primary-1 rounded-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 bg-primary-4/10 rounded-full flex items-center justify-center group-hover:bg-primary-4/20 transition-colors">
              <Sparkles className="w-6 h-6 text-primary-4" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-neutrals-1">Experience Recommender</h4>
              <p className="text-sm text-neutrals-4">Get personalized experience recommendations</p>
            </div>
          </button>

          {/* Trip Itinerary Planner Option */}
          <button
            onClick={() => {
              onSelectItinerary();
              onClose();
            }}
            className="w-full p-4 border-2 border-neutrals-6 hover:border-primary-1 rounded-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 bg-green-600/10 rounded-full flex items-center justify-center group-hover:bg-green-600/20 transition-colors">
              <Map className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-neutrals-1">AI Trip Planner</h4>
              <p className="text-sm text-neutrals-4">Plan your perfect trip with AI assistance</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSelectionModal;

