import React from 'react';

const MessageItem = ({ message }) => {
  return (
    <div key={message.id} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm text-sm ${message.sender === 'You' ? 'bg-primary-4 text-white' : 'bg-white text-neutrals-1 border border-neutrals-6'}`}>
        <div>{message.text}</div>
        <div className="text-xs text-neutrals-4 mt-1 text-right">{message.timestamp}</div>
      </div>
    </div>
  );
};

const MessageList = ({ messages }) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {messages.map(message => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;