import { useState } from 'react';
import Navbar from '../components/Layout/Navbar';
import ChatList from '../components/Chat/ChatList';
import MessagePane from '../components/Chat/MessagePane';
import MessageInput from '../components/Chat/MessageInput';

const ChatPage = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  return (
    <div className="h-screen flex flex-col antialiased text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
      <Navbar onToggleMobileNav={toggleMobileNav} />
      <div className="flex flex-1 pt-16 overflow-hidden"> {/* pt-16 for navbar height */}
        <ChatList isMobileNavOpen={isMobileNavOpen} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isMobileNavOpen && 'sm:ml-0 ml-[-100%]'}`}>
           <MessagePane />
           <MessageInput />
        </div>
      </div>
    </div>
  );
};
export default ChatPage;