import { useAuth } from "../../contexts/authContext";
import { useState } from "react";
import { MessageSquare, Menu } from "lucide-react";
import Avatar from "../common/Avatar"; // Assuming you have an Avatar component

const Navbar = ({ onToggleMobileNav }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={onToggleMobileNav} className="sm:hidden mr-3 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <Menu size={24} />
            </button>
            <div className="flex-shrink-0 flex items-center">
              <MessageSquare className="h-8 w-auto text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-2xl font-bold text-gray-800 dark:text-white">EduChat</span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300 mr-3 hidden sm:block">Welcome, {user.fullName}</span>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500">
                <Avatar src={user.profilePictureUrl} alt={user.fullName} size="md" />
              </button>
              {dropdownOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    onMouseLeave={() => setDropdownOpen(false)}
                >
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Your Profile</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Settings</a>
                  <button
                    onClick={logout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;