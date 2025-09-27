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
          {conversation?.title}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs text-neutrals-4 mt-1">
          {conversation?.experience ? (
            <>
              {conversation.experience.price && (
                <span className="bg-neutrals-7 px-2 py-1 rounded">
                  ${conversation.experience.price}/person
                </span>
              )}
              {conversation.experience.location && (
                <span className="bg-neutrals-7 px-2 py-1 rounded">
                  {conversation.experience.location}
                </span>
              )}
            </>
          ) : (
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
              Experience Unavailable
            </span>
          )}
          <span className="bg-neutrals-7 px-2 py-1 rounded">{conversation?.participants || "You & Guide"}</span>
          <span className="bg-neutrals-7 px-2 py-1 rounded">{conversation?.activity || "Experience Chat"}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;