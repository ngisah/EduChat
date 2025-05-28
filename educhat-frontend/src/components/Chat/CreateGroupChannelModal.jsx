const CreateGroupChannelModal = ({ onClose }) => {
    const { createGroupChannel, searchUsers, userSearchResults, setUserSearchResults, isCreatingChannel } = useChat();
    const { user } = useAuth();
    const [channelName, setChannelName] = useState('');
    const [description, setDescription] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]); // Array of user objects
    const [error, setError] = useState('');

    const handleMemberSearch = (e) => {
        setMemberSearchTerm(e.target.value);
        searchUsers(e.target.value);
    };

    const toggleMemberSelection = (memberUser) => {
        if (selectedMembers.find(m => m.id === memberUser.id)) {
            setSelectedMembers(prev => prev.filter(m => m.id !== memberUser.id));
        } else {
            setSelectedMembers(prev => [...prev, memberUser]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!channelName.trim()) {
            setError("Channel name is required.");
            return;
        }
        if (selectedMembers.length === 0) {
            setError("Please select at least one member (besides yourself).");
            // Note: Creator is auto-added in ChatContext
            // return;
        }
        try {
            const memberIds = selectedMembers.map(m => m.id);
            await createGroupChannel(channelName, description, memberIds);
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.message || "Failed to create group channel.");
        }
    };
    
    useEffect(() => {
        // Clear search results when modal closes or search term is empty
        return () => setUserSearchResults([]);
    }, [setUserSearchResults]);


    return (
        <Modal isOpen={true} onClose={onClose} title="Create New Group Channel" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg flex items-center"><AlertTriangle size={18} className="mr-2" />{error}</div>}
                <div>
                    <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel Name</label>
                    <input
                        id="channelName"
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label htmlFor="memberSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add Members</label>
                    <input
                        id="memberSearch"
                        type="text"
                        placeholder="Search for users to add..."
                        value={memberSearchTerm}
                        onChange={handleMemberSearch}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                    {userSearchResults.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                            {userSearchResults
                                .filter(u => u.id !== user?.id) // Don't show current user in list to add self
                                .map(u => (
                                <div key={u.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer" onClick={() => toggleMemberSelection(u)}>
                                    <div className="flex items-center space-x-2">
                                        <Avatar src={u.profilePictureUrl} alt={u.fullName} size="sm" />
                                        <span className="text-sm text-gray-800 dark:text-gray-100">{u.fullName}</span>
                                    </div>
                                    <input type="checkbox" checked={selectedMembers.some(m => m.id === u.id)} readOnly className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 {selectedMembers.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Members:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {selectedMembers.map(m => (
                                <span key={m.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 text-xs rounded-full flex items-center">
                                    {m.fullName}
                                    <button type="button" onClick={() => toggleMemberSelection(m)} className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={isCreatingChannel} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                        {isCreatingChannel ? <LoadingSpinner size="sm" color="text-white" /> : 'Create Channel'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
