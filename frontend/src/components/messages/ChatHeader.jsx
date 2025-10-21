import React from 'react';
import { Link } from 'react-router-dom';

const ChatHeader = ({ conversation, onBack, showBackButton = false, isCancelledByGuide = false }) => {
  const isTripChat = conversation?.isTripChat;
  const experienceId = isTripChat
    ? conversation?.schedule?.experience?.experienceId
    : conversation?.experience?.experienceId;

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
      {experienceId ? (
        <Link
          to={`/experience/${experienceId}`}
          className="flex items-center gap-4 flex-1 min-w-0"
        >
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img
              src={conversation?.avatar}
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-neutrals-1 text-lg truncate">
                <span className={isCancelledByGuide ? 'line-through' : ''}>
                  {isTripChat ? conversation?.title : (conversation?.participantName || "Guide")}
                </span>
                {isCancelledByGuide && (
                  <span className="text-red-600 font-medium ml-2">(CANCELLED BY GUIDE)</span>
                )}
              </h3>
              {isTripChat && (
                <span className="flex-shrink-0 bg-primary-6 text-primary-4 text-xs px-2 py-0.5 rounded">
                  Group
                </span>
              )}
            </div>
            <h4 className="font-normal text-neutrals-2 text-sm truncate mb-1">
              {isTripChat ? conversation?.participants : conversation?.title}
            </h4>
            <div className="flex flex-wrap gap-2 text-xs text-neutrals-4 mt-1">
              {(isTripChat ? conversation?.schedule?.experience : conversation?.experience) ? (
                <>
                  {(isTripChat ? conversation?.schedule?.experience?.price : conversation?.experience?.price) && (
                    <span className="bg-neutrals-7 px-2 py-1 rounded">
                      ${isTripChat ? conversation.schedule.experience.price : conversation.experience.price}/person
                    </span>
                  )}
                  {(isTripChat ? conversation?.schedule?.experience?.location : conversation?.experience?.location) && (
                    <span className="bg-neutrals-7 px-2 py-1 rounded">
                      {isTripChat ? conversation.schedule.experience.location : conversation.experience.location}
                    </span>
                  )}
                </>
              ) : (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
                  Experience Unavailable
                </span>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <>
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img
              src={conversation?.avatar}
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-neutrals-1 text-lg truncate">
                <span className={isCancelledByGuide ? 'line-through' : ''}>
                  {isTripChat ? conversation?.title : (conversation?.participantName || "Guide")}
                </span>
                {isCancelledByGuide && (
                  <span className="text-red-600 font-medium ml-2">(CANCELLED BY GUIDE)</span>
                )}
              </h3>
              {isTripChat && (
                <span className="flex-shrink-0 bg-primary-6 text-primary-4 text-xs px-2 py-0.5 rounded">
                  Group
                </span>
              )}
            </div>
            <h4 className="font-normal text-neutrals-2 text-sm truncate mb-1">
              {isTripChat ? conversation?.participants : conversation?.title}
            </h4>
            <div className="flex flex-wrap gap-2 text-xs text-neutrals-4 mt-1">
              {(isTripChat ? conversation?.schedule?.experience : conversation?.experience) ? (
                <>
                  {(isTripChat ? conversation?.schedule?.experience?.price : conversation?.experience?.price) && (
                    <span className="bg-neutrals-7 px-2 py-1 rounded">
                      ${isTripChat ? conversation.schedule.experience.price : conversation.experience.price}/person
                    </span>
                  )}
                  {(isTripChat ? conversation?.schedule?.experience?.location : conversation?.experience?.location) && (
                    <span className="bg-neutrals-7 px-2 py-1 rounded">
                      {isTripChat ? conversation.schedule.experience.location : conversation.experience.location}
                    </span>
                  )}
                </>
              ) : (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
                  Experience Unavailable
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatHeader;