export const chatService = {
  getChannels: async (userId) => {
    console.log('Mock fetching channels for user:', userId);
    // ... (rest of getChannels logic from original App.js)
    if (userId === 'student1') {
      return Promise.resolve([
        { id: 'general', name: 'General Discussion', unreadCount: 2, lastMessage: { text: 'Hello everyone!', sender: 'Mr. David Lee', time: '10:30 AM' }, type: 'group' },
        { id: 'math101', name: 'Mathematics 101', unreadCount: 0, lastMessage: { text: 'Assignment due Friday.', sender: 'Mr. David Lee', time: 'Yesterday' }, type: 'group' },
        { id: 'teacher1_chat', name: 'Mr. David Lee', unreadCount: 1, lastMessage: { text: 'Can we discuss the project?', sender: 'Sarah Student', time: '9:15 AM' }, type: 'direct', members: [{id: 'teacher1', fullName: 'Mr. David Lee', profilePictureUrl: 'https://placehold.co/100x100/C0C0C0/505050?text=D'}] },
      ]);
    }
    if (userId === 'teacher1') {
       return Promise.resolve([
        { id: 'general', name: 'General Discussion', unreadCount: 0, lastMessage: { text: 'Hello everyone!', sender: 'Mr. David Lee', time: '10:30 AM' }, type: 'group' },
        { id: 'math101', name: 'Mathematics 101', unreadCount: 0, lastMessage: { text: 'Assignment due Friday.', sender: 'Mr. David Lee', time: 'Yesterday' }, type: 'group' },
        { id: 'student1_chat', name: 'Sarah Student', unreadCount: 1, lastMessage: { text: 'Can we discuss the project?', sender: 'Sarah Student', time: '9:15 AM' }, type: 'direct', members: [{id: 'student1', fullName: 'Sarah Student', profilePictureUrl: 'https://placehold.co/100x100/E0E0E0/757575?text=S'}] },
      ]);
    }
    return Promise.resolve([]);
  },
  getMessages: async (channelId) => {
    console.log('Mock fetching messages for channel:', channelId);
    // ... (rest of getMessages logic)
    const messages = {
      general: [
        { id: 'm1', text: 'Welcome to General Discussion!', senderId: 'system', senderName: 'System', time: '10:00 AM', avatar: 'https://placehold.co/40x40/A0A0A0/FFFFFF?text=Sys' },
        { id: 'm2', text: 'Hello everyone!', senderId: 'teacher1', senderName: 'Mr. David Lee', time: '10:30 AM', avatar: 'https://placehold.co/40x40/C0C0C0/505050?text=D' },
      ],
      math101: [
        { id: 'm3', text: 'Assignment due Friday.', senderId: 'teacher1', senderName: 'Mr. David Lee', time: 'Yesterday', avatar: 'https://placehold.co/40x40/C0C0C0/505050?text=D' },
      ],
      teacher1_chat: [
         { id: 'm4', text: 'Can we discuss the project?', senderId: 'student1', senderName: 'Sarah Student', time: '9:15 AM', avatar: 'https://placehold.co/40x40/E0E0E0/757575?text=S' },
      ],
      student1_chat: [
         { id: 'm5', text: 'Can we discuss the project?', senderId: 'student1', senderName: 'Sarah Student', time: '9:15 AM', avatar: 'https://placehold.co/40x40/E0E0E0/757575?text=S' },
      ]
    };
    return Promise.resolve(messages[channelId] || []);
  },
  searchUsers: async (query) => {
    console.log('Mock searching users:', query);
    // ... (rest of searchUsers logic)
    const allUsers = [
        { id: 'student1', fullName: 'Sarah Student', email: 'student@educhat.app', role: 'student', profilePictureUrl: 'https://placehold.co/100x100/E0E0E0/757575?text=S' },
        { id: 'teacher1', fullName: 'Mr. David Lee', email: 'teacher@educhat.app', role: 'educator', profilePictureUrl: 'https://placehold.co/100x100/C0C0C0/505050?text=D' },
        { id: 'student2', fullName: 'John Doe', email: 'john@example.com', role: 'student', profilePictureUrl: 'https://placehold.co/100x100/DDEEFF/333333?text=J' },
    ];
    if (!query) return Promise.resolve([]);
    return Promise.resolve(allUsers.filter(user => user.fullName.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase())));
  },
  createChannel: async (name, description, memberIds, isPrivateChat = false) => {
    console.log('Mock creating channel:', name, memberIds);
    // ... (rest of createChannel logic)
    const newChannelId = `new-${Date.now()}`;
    const members = memberIds.map(id => ({id, fullName: `User ${id}`})); // Simplified
    return Promise.resolve({
        id: newChannelId,
        name: isPrivateChat && members.length > 0 ? members[0].fullName : name,
        description,
        unreadCount: 0,
        lastMessage: { text: 'Channel created', sender: 'System', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        type: isPrivateChat ? 'direct' : 'group',
        members: isPrivateChat ? members : [],
        creatorId: 'currentUser',
    });
  }
};