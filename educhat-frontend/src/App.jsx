import React, { createContext, useState, useEffect, useContext } from 'react';

import { Send, MessageSquare, Users, LogOut, UserCircle, Settings, Search, Paperclip, Smile, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, Info, Eye, EyeOff, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/authContext';
import { ChatProvider } from './contexts/chatContext';
import LoadingSpinner from './components/common/LoadingSpiner';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegistrationForm';






function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <ChatProvider>
          <ChatPage />
        </ChatProvider>
      ) : (
        <AuthPage />
      )}
    </>
  );
}

// Default export for the main App component
export default function MainApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
