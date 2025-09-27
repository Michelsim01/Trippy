import React from 'react';

const ConversationItem = ({ conversation, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`p-4 cursor-pointer hover:bg-neutrals-7 transition-colors ${isSelected ? 'bg-neutrals-7' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={conversation.avatar}
            alt="Chat"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-neutrals-1 truncate text-sm">
              {conversation.participantName || "Guide"}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-neutrals-4">
                {conversation.timestamp}
              </span>
              {conversation.unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-neutrals-3 truncate mb-1">
            {conversation.title}
          </p>
          <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-neutrals-1' : 'text-neutrals-3'}`}>
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

const ConversationList = ({ conversations, selectedChat, onChatSelect, showMobileChevron = false }) => {
  return (
    <div className="divide-y divide-neutrals-6">
      {conversations.map((conversation) => (
        <div key={conversation.id}>
          <ConversationItem 
            conversation={conversation} 
            isSelected={selectedChat === conversation.id}
            onSelect={onChatSelect}
          />
          {showMobileChevron && (
            <div className="flex items-center justify-end pr-4 pb-4 -mt-4">
              <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;