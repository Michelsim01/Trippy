import React from 'react';

const ChatHeader = ({ conversation, onBack, showBackButton = false }) => {
  return (
    <div className="p-4 border-b border-neutrals-6 bg-white flex items-center gap-4">
      {showBackButton && (
        <button
          className="mr-2 text-neutrals-4 focus:outline-none"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={conversation?.avatar}
          alt="Chat"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-neutrals-1 text-lg truncate">
          {conversation?.participantName || "Guide"}
        </h3>
        <h4 className="font-normal text-neutrals-2 text-sm truncate mb-1">
          {conversation?.title}
        </h4>
        <div className="flex flex-wrap gap-3 text-xs text-neutrals-4">
          {conversation?.experience?.price && (
            <span className="font-bold text-neutrals-1">
              ${conversation.experience.price}
            </span>
          )}
          {conversation?.experience?.location && (
            <span>
              {conversation.experience.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;