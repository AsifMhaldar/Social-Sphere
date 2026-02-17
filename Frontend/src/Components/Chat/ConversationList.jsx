export default function ConversationList({
  conversations,
  users,
  currentUser,
  activeTab,
  onUserSelect,
  unreadCounts,
  isUserOnline,
}) {
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Empty states */}
      {activeTab === "inbox" && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No conversations yet</h3>
          <p className="text-gray-500 text-sm">Start chatting with someone from the Users tab</p>
        </div>
      )}

      {activeTab === "users" && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500 text-sm">Check back later for new users</p>
        </div>
      )}

      {/* INBOX TAB */}
      {activeTab === "inbox" &&
        conversations.map((conv, index) => {
          const friend = conv.members.find(
            (m) => m._id !== currentUser._id
          );
          const unreadCount = unreadCounts?.[conv._id] || 0;

          return (
            <div
              key={conv._id}
              onClick={() => onUserSelect(friend)}
              className="relative flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 group"
            >
              {/* Animated background on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex items-center gap-3 w-full">
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                      {friend?.firstName?.charAt(0)}
                      {friend?.lastName?.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-3 border-white transition-all duration-300 ${
                      isUserOnline(friend?._id) 
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-lg animate-bounceIn">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {friend?.firstName} {friend?.lastName}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatLastMessageTime(conv.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {/* Typing indicator or last message */}
                    <p className={`text-sm truncate flex-1 ${
                      unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
                    }`}>
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    
                    {/* Status icons */}
                    {conv.lastMessageSender === currentUser._id && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {conv.lastMessageStatus === 'seen' && '✓✓'}
                        {conv.lastMessageStatus === 'delivered' && '✓✓'}
                        {conv.lastMessageStatus === 'sent' && '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      {/* USERS TAB */}
      {activeTab === "users" &&
        users.map((u, index) => (
          <div
            key={u._id}
            onClick={() => onUserSelect(u)}
            className="relative flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex items-center gap-3 w-full">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  {u.firstName?.charAt(0)}
                  {u.lastName?.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-3 border-white transition-all duration-300 ${
                  isUserOnline(u._id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">
                  {u.firstName} {u.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate mt-1">
                  {u.email}
                </p>
                {u.bio && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {u.bio}
                  </p>
                )}
              </div>

              {/* Start chat button (visible on hover) */}
              <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-600 shadow-md">
                Chat
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}