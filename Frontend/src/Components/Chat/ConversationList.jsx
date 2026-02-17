export default function ConversationList({
  conversations,
  users,
  currentUser,
  activeTab,
  onUserSelect,
  unreadCounts,
  isUserOnline,
}) {
  return (
    <div className="flex flex-col">

      {/* INBOX TAB */}
      {activeTab === "inbox" &&
        conversations.map((conv) => {
          const friend = conv.members.find(
            (m) => m._id !== currentUser._id
          );

          return (
            <div
              key={conv._id}
              onClick={() => onUserSelect(friend)}
              className="flex items-center gap-3 p-4 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  {friend?.firstName?.charAt(0)}
                </div>

                {isUserOnline(friend?._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>

              <div className="flex-1">
                <p className="font-semibold">{friend?.firstName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {conv.lastMessage || "No messages yet"}
                </p>
              </div>

              {unreadCounts?.[conv._id] > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCounts[conv._id]}
                </span>
              )}
            </div>
          );
        })}

      {/* USERS TAB */}
      {activeTab === "users" &&
        users.map((u) => (
          <div
            key={u._id}
            onClick={() => onUserSelect(u)}
            className="flex items-center gap-3 p-4 hover:bg-gray-100 cursor-pointer border-b"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
                {u.firstName?.charAt(0)}
              </div>

              {isUserOnline(u._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>

            <div>
              <p className="font-semibold">{u.firstName}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>
          </div>
        ))}
    </div>
  );
}
