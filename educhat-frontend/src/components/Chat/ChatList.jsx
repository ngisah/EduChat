import { useState } from 'react';
import { useChat } from '../../contexts/chatContext';
import { useAuth } from '../../contexts/authContext';
import ChatListItem from './ChatListItem';
import { useEffect, useRef } from 'react';
import CreateGroupChannelModal from './CreateGroupChannelModal';
import Avatar from '../common/Avatar';
import { Search, Users } from 'lucide-react';

import LoadingSpinner from '../common/LoadingSpiner';
const ChatList = ({ isMobileNavOpen }) => {
  const { channels, activeChannelId, selectChannel, loadingChannels, searchUsers, userSearchResults, setUserSearchResults, createDirectMessageChannel, createGroupChannel } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const searchInputRef = useRef(null);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    searchUsers(e.target.value);
  };

  const handleSelectUserForDM = (targetUser) => {
    createDirectMessageChannel(targetUser);
    setSearchTerm('');
    setUserSearchResults([]);
    setIsSearchActive(false);
  };
  
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  if (loadingChannels) {
    return <div className="p-4 flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isMobileNavOpen ? 'w-full sm:w-80' : 'w-0 sm:w-80 overflow-hidden'}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search or start new chat..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchActive(true)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
        {user?.role === 'educator' && !isSearchActive && (
            <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="mt-3 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
                <Users size={18} className="mr-2"/> Create Group
            </button>
        )}
      </div>

      {isSearchActive && (
        <div className="absolute top-20 left-0 right-0 sm:left-auto sm:right-auto sm:w-80 bg-white dark:bg-gray-800 shadow-lg rounded-b-lg z-10 max-h-[calc(100vh-10rem)] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {userSearchResults.length > 0 ? (
                userSearchResults.map(u => (
                    <div key={u.id} onClick={() => handleSelectUserForDM(u)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 border-b dark:border-gray-700 last:border-b-0">
                        <Avatar src={u.profilePictureUrl} alt={u.fullName} size="md" />
                        <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{u.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                    </div>
                ))
            ) : searchTerm && (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No users found for "{searchTerm}".</p>
            )}
            <button onClick={() => { setIsSearchActive(false); setSearchTerm(''); setUserSearchResults([]); }} className="w-full p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel Search
            </button>
        </div>
      )}

      {!isSearchActive && (
        <ul className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.length === 0 && !loadingChannels && (
            <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No chats yet. Start a new conversation!</p>
          )}
          {channels.map(channel => (
            <ChatListItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onSelectChannel={selectChannel}
            />
          ))}
        </ul>
      )}
      {showCreateGroupModal && <CreateGroupChannelModal onClose={() => setShowCreateGroupModal(false)} />}
    </div>
  );
};
export default ChatList;