import React from 'react';

const AIChatButton = ({ onClick, size = "default" }) => {
  const isSmall = size === "small";
  
  return (
    <button
      onClick={onClick}
      className={`w-full bg-primary-1 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
        isSmall ? 'py-2 px-3 text-xs' : 'py-3 px-4 text-sm'
      }`}
    >
      <svg className={isSmall ? "w-4 h-4" : "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Start a new chat with Trippy AI
    </button>
  );
};

export default AIChatButton;