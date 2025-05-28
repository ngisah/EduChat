import { createContext, useEffect, useState, useContext, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './authContext';
import useWebSockets  from '../hooks/useWebSockets';




const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState({}); // { channelId: [messageObjects] }
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { channelId: { userId: userName } }
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const mockWebSocketURL = isAuthenticated ? 'wss://educhat.mock.ws/chat' : null;

  const handleNewMessage = (messageEvent) => {
    console.log('Received WebSocket event:', messageEvent);
    if (messageEvent.type === 'new_message') {
        const { channel_id, ...newMessage } = messageEvent.payload;
        setMessages(prevMessages => ({
            ...prevMessages,
            [channel_id]: [...(prevMessages[channel_id] || []), newMessage],
        }));
        // Update last message in channel list
        setChannels(prev => prev.map(ch => 
            ch.id === channel_id ? { ...ch, lastMessage: { text: newMessage.content, sender: newMessage.senderName, time: newMessage.sent_at }, unreadCount: ch.id === activeChannelId ? 0 : (ch.unreadCount || 0) + 1 } : ch
        ));
    } else if (messageEvent.type === 'user_typing') {
        const { channel_id, user_id, user_name } = messageEvent.payload;
        setTypingUsers(prev => ({
            ...prev,
            [channel_id]: { ...(prev[channel_id] || {}), [user_id]: user_name }
        }));
    } else if (messageEvent.type === 'user_stopped_typing') {
        const { channel_id, user_id } = messageEvent.payload;
        setTypingUsers(prev => {
            const updatedChannelTyping = { ...(prev[channel_id] || {}) };
            delete updatedChannelTyping[user_id];
            return { ...prev, [channel_id]: updatedChannelTyping };
        });
    } else if (messageEvent.type === 'presence_update') {
        // Handle presence update if needed in UI
        console.log('Presence update:', messageEvent.payload);
    }
  };
  
  const { sendMessage: wsSendMessage, isConnected: wsIsConnected } = useWebSockets(
    mockWebSocketURL, 
    handleNewMessage,
    () => console.log('WebSocket connected'),
    () => console.log('WebSocket disconnected'),
    (err) => console.error('WebSocket error:', err)
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      setLoadingChannels(true);
      chatService.getChannels(user.id)
        .then(data => {
            setChannels(data);
            if (data.length > 0 && !activeChannelId) {
                // setActiveChannelId(data[0].id); // Auto-select first channel
            }
        })
        .catch(console.error)
        .finally(() => setLoadingChannels(false));
    } else {
      setChannels([]);
      setActiveChannelId(null);
      setMessages({});
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeChannelId) {
      setLoadingMessages(true);
      // Reset unread count for active channel
      setChannels(prev => prev.map(ch => ch.id === activeChannelId ? {...ch, unreadCount: 0} : ch));

      chatService.getMessages(activeChannelId)
        .then(data => setMessages(prev => ({ ...prev, [activeChannelId]: data })))
        .catch(console.error)
        .finally(() => setLoadingMessages(false));
    }
  }, [activeChannelId]);

  const selectChannel = (channelId) => {
    setActiveChannelId(channelId);
  };

  const postMessage = (channelId, content) => {
    if (!wsIsConnected) {
        console.error("WebSocket not connected. Cannot send message.");
        // Optionally, queue message or show error to user
        return;
    }
    const messageData = {
      type: 'send_message',
      payload: {
        channel_id: channelId,
        content: content,
        // sender_id: user.id, // Server should determine this from authenticated WebSocket
      }
    };
    wsSendMessage(messageData);
  };
  
  const sendTypingEvent = (channelId, isTyping) => {
    if (!wsIsConnected) return;
    wsSendMessage({
        type: isTyping ? 'typing_started' : 'typing_stopped',
        payload: { channel_id: channelId }
    });
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
        setUserSearchResults([]);
        return;
    }
    const results = await chatService.searchUsers(query);
    setUserSearchResults(results);
  };

  const createDirectMessageChannel = async (targetUser) => {
    if (!user) return;
    // Check if DM already exists
    const existingDM = channels.find(ch => ch.type === 'direct' && ch.members && ch.members.some(m => m.id === targetUser.id));
    if (existingDM) {
        setActiveChannelId(existingDM.id);
        return;
    }

    setIsCreatingChannel(true);
    try {
        // For DM, channel name is often the other user's name.
        // The backend would handle creating a unique channel ID and adding both users.
        const newChannel = await chatService.createChannel(targetUser.fullName, `Direct message with ${targetUser.fullName}`, [targetUser.id, user.id], true);
        setChannels(prev => [...prev, newChannel]);
        setActiveChannelId(newChannel.id);
        setUserSearchResults([]); // Clear search results
    } catch (error) {
        console.error("Error creating DM channel:", error);
        // Show error to user
    } finally {
        setIsCreatingChannel(false);
    }
  };
  
  const createGroupChannel = async (name, description, memberIds) => {
    if (!user || user.role !== 'educator') {
        console.error("Only educators can create group channels.");
        return; // Or show error
    }
    setIsCreatingChannel(true);
    try {
        const allMemberIds = [...new Set([user.id, ...memberIds])]; // Ensure creator is a member
        const newChannel = await chatService.createChannel(name, description, allMemberIds, false);
        setChannels(prev => [...prev, newChannel]);
        setActiveChannelId(newChannel.id);
        return newChannel; // Return the new channel for potential further actions
    } catch (error) {
        console.error("Error creating group channel:", error);
        throw error; // Re-throw for the component to handle
    } finally {
        setIsCreatingChannel(false);
    }
  };

  return (
    <ChatContext.Provider value={{ 
        channels, activeChannelId, messages: messages[activeChannelId] || [], 
        loadingChannels, loadingMessages, typingUsers: typingUsers[activeChannelId] || {},
        selectChannel, postMessage, sendTypingEvent, wsIsConnected,
        searchUsers, userSearchResults, setUserSearchResults, createDirectMessageChannel, createGroupChannel, isCreatingChannel
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);