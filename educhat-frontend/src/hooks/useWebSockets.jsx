import { useEffect, useRef, useState } from 'react';
const useWebSockets = (url, onMessageCallback, onOpenCallback, onCloseCallback, onErrorCallback) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!url) return;

    // Mock WebSocket behavior
    console.log(`Mock WebSocket: Connecting to ${url}`);
    ws.current = {
      send: (data) => {
        console.log('Mock WebSocket: Sending data', JSON.parse(data));
        // Simulate server echoing message or processing it
        const message = JSON.parse(data);
        if (message.type === 'send_message' && onMessageCallback) {
          // Simulate receiving the same message back, or a new message from another user
          const receivedMessage = {
            type: 'new_message',
            payload: {
              id: `msg-${Date.now()}`, // Use message.payload.id if client generates it
              channel_id: message.payload.channel_id,
              senderId: 'currentUser', // This should be the actual user ID from AuthContext
              senderName: 'You', // This should be the actual user name
              senderAvatar: 'https://placehold.co/40x40/7B1FA2/FFFFFF?text=Me',
              content: message.payload.content,
              sent_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          };
          setTimeout(() => onMessageCallback(receivedMessage), 500); // Simulate network delay

          // Simulate another user responding or a system message
          if (message.payload.content.toLowerCase().includes("hello")) {
            const autoResponseMessage = {
              type: 'new_message',
              payload: {
                id: `msg-resp-${Date.now()}`,
                channel_id: message.payload.channel_id,
                senderId: 'botUser',
                senderName: 'EduBot',
                senderAvatar: 'https://placehold.co/40x40/00ACC1/FFFFFF?text=Bot',
                content: "Hello there! How can I help you today?",
                sent_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            };
            setTimeout(() => onMessageCallback(autoResponseMessage), 1500);
          }
        } else if (message.type === 'typing_started' && onMessageCallback) {
            const typingEvent = { type: 'user_typing', payload: { channel_id: message.payload.channel_id, user_id: 'otherUser', user_name: 'Other User' } };
            setTimeout(() => onMessageCallback(typingEvent), 200);
        } else if (message.type === 'typing_stopped' && onMessageCallback) {
            const typingEvent = { type: 'user_stopped_typing', payload: { channel_id: message.payload.channel_id, user_id: 'otherUser' } };
            setTimeout(() => onMessageCallback(typingEvent), 200);
        }
      },
      close: () => {
        console.log('Mock WebSocket: Closing connection');
        setIsConnected(false);
        if (onCloseCallback) onCloseCallback();
      },
    };

    setTimeout(() => {
      setIsConnected(true);
      if (onOpenCallback) onOpenCallback();
      console.log(`Mock WebSocket: Connected to ${url}`);
      // Simulate receiving a presence update
      if (onMessageCallback) {
        const presenceUpdate = {
          type: 'presence_update',
          payload: { user_id: 'teacher1', status: 'online' }
        };
        setTimeout(() => onMessageCallback(presenceUpdate), 1000);
      }
    }, 1000); // Simulate connection delay

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessageCallback, onOpenCallback, onCloseCallback, onErrorCallback]);

  const sendMessage = (data) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected.');
    }
  };

  return { sendMessage, isConnected };
};

export default useWebSockets;