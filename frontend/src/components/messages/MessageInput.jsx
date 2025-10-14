import React from 'react';

const MessageInput = ({ newMessage, setNewMessage, onSendMessage, onKeyDown, isScheduleCancelled = false }) => {
  if (isScheduleCancelled) {
    return (
      <div className="p-4 border-t border-neutrals-6 bg-neutrals-7">
        <div className="text-center text-neutrals-3 text-sm py-3">
          You can no longer send messages here as the guide has cancelled this booking
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-neutrals-6 bg-white flex gap-2">
      <input
        type="text"
        className="flex-1 border border-neutrals-6 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-1"
        placeholder="Type your message..."
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        onClick={onSendMessage}
        className="bg-primary-1 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-200"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;