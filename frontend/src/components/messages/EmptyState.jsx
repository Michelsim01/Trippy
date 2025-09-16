import React from 'react';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  buttonText, 
  onButtonClick, 
  isChat = false 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${isChat ? 'h-full' : 'h-64'} p-8 text-center bg-white rounded-lg`}>
      <div className="w-16 h-16 bg-neutrals-6 rounded-full flex items-center justify-center mb-4">
        {icon || (
          <svg className="w-8 h-8 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </div>
      <p className="text-neutrals-3 mb-2 font-medium">{title || "No conversations yet"}</p>
      <p className="text-sm text-neutrals-4 mb-4">{description || "Start chatting with Trippy AI or other travelers!"}</p>
      {buttonText && (
        <button
          onClick={onButtonClick}
          className="bg-primary-1 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;