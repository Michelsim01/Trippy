import React from 'react';

const ConversationItem = ({ conversation, isSelected, onSelect }) => {
  const isTripChat = conversation.isTripChat;

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`p-4 cursor-pointer hover:bg-neutrals-7 transition-colors ${isSelected ? 'bg-neutrals-7' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img
            src={conversation.avatar}
            alt="Chat"
            className="w-full h-full object-cover"
          />
          {isTripChat && (
            <div className="absolute bottom-0 right-0 bg-primary-4 rounded-full p-1">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-medium text-neutrals-1 truncate text-sm">
                <span className={isTripChat && conversation?.schedule?.cancelled === true ? 'line-through' : ''}>
                  {isTripChat ? conversation.title : (conversation.participantName || "Guide")}
                </span>
                {isTripChat && conversation?.schedule?.cancelled === true && (
                  <span className="text-red-600 font-medium ml-1">(CANCELLED)</span>
                )}
              </h3>
              {isTripChat && (
                <span className="flex-shrink-0 bg-primary-6 text-primary-4 text-xs px-2 py-0.5 rounded">
                  Group
                </span>
              )}
            </div>
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
            {isTripChat ? conversation.participants : conversation.title}
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
  console.log('ConversationList - conversations:', conversations.map(c => ({
    id: c.id,
    isTripChat: c.isTripChat,
    title: c.title,
    participantName: c.participantName
  })));

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