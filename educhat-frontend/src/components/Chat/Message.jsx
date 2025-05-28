import Avatar from "../common/Avatar";
const Message = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwnMessage && (
          <Avatar src={message.senderAvatar} alt={message.senderName} size="sm" className="mr-2 mb-1" />
        )}
        <div
          className={`px-4 py-2 rounded-xl shadow ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          {!isOwnMessage && <p className="text-xs font-semibold mb-0.5 text-blue-600 dark:text-blue-400">{message.senderName}</p>}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} text-right`}>
            {message.sent_at}
          </p>
        </div>
         {isOwnMessage && (
          <Avatar src={message.senderAvatar} alt={message.senderName} size="sm" className="ml-2 mb-1" />
        )}
      </div>
    </div>
  );
};
export default Message;