import { useChat } from "../../contexts/chatContext";
import { useAuth } from "../../contexts/authContext";
import { useEffect, useRef } from "react";
import Message from "./Message";
import Avatar from "../common/Avatar";
import TypingIndicator from "./TypingIndicator";
import LoadingSpinner from "../common/LoadingSpiner";
import { MessageSquare, Settings } from "lucide-react";
const MessagePane = () => {
  const { messages, loadingMessages, activeChannelId, typingUsers } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChannelDetails = useChat().channels.find(ch => ch.id === activeChannelId);
  const paneTitle = activeChannelDetails?.type === 'direct' && activeChannelDetails.members && activeChannelDetails.members.length > 0 && activeChannelDetails.members[0].id !== user?.id
    ? activeChannelDetails.members[0].fullName
    : (activeChannelDetails?.type === 'direct' && activeChannelDetails.members && activeChannelDetails.members.length > 1 && activeChannelDetails.members[1].id !== user?.id ? activeChannelDetails.members[1].fullName : activeChannelDetails?.name);

  if (!activeChannelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 p-4">
        <MessageSquare size={64} className="mb-4 opacity-50" />
        <p className="text-xl">Select a chat to start messaging</p>
        <p className="text-sm mt-2">Or, search for users to begin a new conversation.</p>
      </div>
    );
  }
  
  if (loadingMessages) {
    return <div className="flex-1 flex justify-center items-center bg-gray-50 dark:bg-gray-900"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <Avatar src={activeChannelDetails?.type === 'direct' ? (activeChannelDetails.members && activeChannelDetails.members.length > 0 && activeChannelDetails.members[0].id !== user?.id ? activeChannelDetails.members[0].profilePictureUrl : (activeChannelDetails.members && activeChannelDetails.members.length > 1 && activeChannelDetails.members[1].id !== user?.id ? activeChannelDetails.members[1].profilePictureUrl : 'https://placehold.co/40x40/78909C/FFFFFF?text=?')) : `https://placehold.co/40x40/78909C/FFFFFF?text=${paneTitle?.charAt(0).toUpperCase()}`} alt={paneTitle} size="md" />
            <div>
                <h2 className="font-semibold text-gray-800 dark:text-white">{paneTitle || 'Chat'}</h2>
                {/* Add online status or member count here if needed */}
                {activeChannelDetails?.type === 'group' && <p className="text-xs text-gray-500 dark:text-gray-400">{activeChannelDetails.description || `${activeChannelDetails.members?.length || 0} members`}</p>}
            </div>
        </div>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <Settings size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            <p>No messages in this chat yet.</p>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        )}
        {messages.map(msg => (
          <Message key={msg.id} message={msg} isOwnMessage={msg.senderId === user?.id || msg.senderName === "You"} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  );
};
export default MessagePane;