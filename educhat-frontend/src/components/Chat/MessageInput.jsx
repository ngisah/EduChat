import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useChat } from '../../contexts/chatContext'; // Adjust the import path as necessary


const MessageInput = () => {
  const [message, setMessage] = useState('');
  const { postMessage, activeChannelId, sendTypingEvent, wsIsConnected } = useChat();
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!activeChannelId || !wsIsConnected) return;

    sendTypingEvent(activeChannelId, true); // Send typing started immediately

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(activeChannelId, false); // Send typing stopped after a delay
    }, 2000); // 2 seconds of inactivity
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChannelId || !wsIsConnected) return;
    postMessage(activeChannelId, message.trim());
    setMessage('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingEvent(activeChannelId, false);
  };

  if (!activeChannelId) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        <button type="button" className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          disabled={!wsIsConnected}
        />
        <button type="button" className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Smile size={20} />
        </button>
        <button
          type="submit"
          disabled={!wsIsConnected || !message.trim()}
          className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
      {!wsIsConnected && <p className="text-xs text-red-500 mt-1 text-center">WebSocket not connected. Trying to reconnect...</p>}
    </form>
  );
};

export default MessageInput;