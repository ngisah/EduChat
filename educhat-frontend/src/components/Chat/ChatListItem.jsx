import { useAuth } from "../../contexts/authContext";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
const ChatListItem = ({ channel, isActive, onSelectChannel }) => {
  const { user } = useAuth();
  const displayName = channel.type === 'direct' && channel.members && channel.members.length > 0 && channel.members[0].id !== user?.id 
    ? channel.members[0].fullName 
    : (channel.type === 'direct' && channel.members && channel.members.length > 1 && channel.members[1].id !== user?.id ? channel.members[1].fullName : channel.name);
  
  const avatarAlt = channel.type === 'direct' && channel.members && channel.members.length > 0 && channel.members[0].id !== user?.id 
    ? channel.members[0].fullName 
    : (channel.type === 'direct' && channel.members && channel.members.length > 1 && channel.members[1].id !== user?.id ? channel.members[1].fullName : channel.name);

  const avatarSrc = channel.type === 'direct' && channel.members && channel.members.length > 0 && channel.members[0].id !== user?.id
    ? channel.members[0].profilePictureUrl
    : (channel.type === 'direct' && channel.members && channel.members.length > 1 && channel.members[1].id !== user?.id ? channel.members[1].profilePictureUrl : `https://placehold.co/40x40/78909C/FFFFFF?text=${channel.name.charAt(0).toUpperCase()}`);

  return (
    <li
      onClick={() => onSelectChannel(channel.id)}
      className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex items-center space-x-3 ${isActive ? 'bg-blue-100 dark:bg-blue-800' : ''}`}
    >
      <Avatar src={avatarSrc} alt={avatarAlt} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`font-semibold text-sm truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>{displayName}</p>
          {channel.lastMessage && <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{channel.lastMessage.time}</p>}
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate pr-2">
            {channel.lastMessage ? `${channel.lastMessage.sender}: ${channel.lastMessage.text}` : 'No messages yet'}
          </p>
          <Badge count={channel.unreadCount} />
        </div>
      </div>
    </li>
  );
};
export default ChatListItem;