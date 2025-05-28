

const TypingIndicator = ({ typingUsers }) => {
    const users = Object.values(typingUsers);
    if (users.length === 0) return null;
  
    let text;
    if (users.length === 1) {
      text = `${users[0]} is typing...`;
    } else if (users.length === 2) {
      text = `${users[0]} and ${users[1]} are typing...`;
    } else {
      text = `${users.slice(0, 2).join(', ')} and others are typing...`;
    }
  
    return (
      <div className="h-6 px-4 text-xs text-gray-500 dark:text-gray-400 italic">
        {text}
      </div>
    );
};
export default TypingIndicator;
