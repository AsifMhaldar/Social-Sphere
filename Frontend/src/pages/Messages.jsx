import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { connectSocket, getSocket } from "../utils/socket";
import {
  getUserConversations,
  getMessages,
  sendMessage,
  createConversation,
  getAllUsers,
} from "../utils/chatApi";
import CallModal from "../Components/CallModal.jsx";

export default function Messages() {
  const user = useSelector((state) => state.auth.user);

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callTypeIncoming, setCallTypeIncoming] = useState(null);

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // =============================
  // LOAD USERS
  // =============================
  useEffect(() => {
    if (!user?._id) return;

    const loadData = async () => {
      try {
        const [usersRes, convRes] = await Promise.all([
          getAllUsers(),
          getUserConversations(user._id)
        ]);
        
        setUsers(usersRes.data.filter((u) => u._id !== user._id));
        setConversations(convRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    connectSocket();
  }, [user]);

  // =============================
  // SOCKET EVENTS
  // =============================
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("getOnlineUsers", setOnlineUsers);

    socket.on("receiveMessage", (data) => {
      if (currentChat && data.conversationId === currentChat._id) {
        setMessages((prev) => [...prev, { ...data, status: "delivered" }]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1,
        }));
      }
    });

    socket.on("typing", (senderId) => {
      setTypingUser(senderId);
      setTimeout(() => setTypingUser(null), 3000);
    });

    socket.on("messageSeen", ({ conversationId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === conversationId
            ? { ...msg, status: "seen" }
            : msg
        )
      );
    });

    socket.on("incomingCall", ({ fromUserId, offer, callType }) => {
      setIncomingCall({ fromUserId, offer });
      setCallTypeIncoming(callType);
    });

    socket.on("callEnded", () => {
      setIncomingCall(null);
      setShowCallModal(false);
    });

    return () => {
      socket.off("getOnlineUsers");
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("messageSeen");
      socket.off("incomingCall");
      socket.off("callEnded");
    };
  }, []);

  // =============================
  // OPEN CHAT - FIXED VERSION
  // =============================
  const openChatWithUser = async (selectedUser, event) => {
    // Prevent event bubbling if event exists
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Opening chat with user:', selectedUser);
    
    if (!selectedUser?._id) {
      console.error('Invalid user object:', selectedUser);
      return;
    }

    setLoading(true);
    setSelectedUserId(selectedUser._id);

    try {
      // Create or get existing conversation
      const convRes = await createConversation({
        senderId: user._id,
        receiverId: selectedUser._id,
      });

      console.log('Conversation created/fetched:', convRes.data);
      setCurrentChat(convRes.data);

      // Get messages for this conversation
      const messageRes = await getMessages(convRes.data._id);
      console.log('Messages loaded:', messageRes.data);
      setMessages(messageRes.data);

      // Reset unread count for this conversation
      setUnreadCounts((prev) => ({
        ...prev,
        [convRes.data._id]: 0,
      }));

      // On mobile, hide sidebar when chat is opened
      if (isMobile) {
        setSidebarOpen(false);
      }
      
      // Focus input after opening chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error opening chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // GO BACK TO SIDEBAR (MOBILE)
  // =============================
  const goBackToSidebar = () => {
    setSidebarOpen(true);
  };

  // =============================
  // SEND MESSAGE
  // =============================
  const handleSend = async (text) => {
    if (!currentChat || !text.trim()) return;

    const receiverId = currentChat.members.find(
      (m) => m._id !== user._id
    )?._id;

    // Create temporary message for instant display
    const tempMessage = {
      _id: Date.now().toString(),
      conversationId: currentChat._id,
      sender: user._id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    // Add to UI immediately
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send to server
      const messageData = {
        conversationId: currentChat._id,
        sender: user._id,
        text: text.trim(),
      };

      const res = await sendMessage(messageData);
      console.log('Message sent successfully:', res);

      // Replace temp message with real one
      setMessages((prev) => 
        prev.map((msg) => 
          msg._id === tempMessage._id 
            ? { ...res.data, status: 'sent' } 
            : msg
        )
      );

      // Emit socket event
      getSocket()?.emit("sendMessage", {
        conversationId: currentChat._id,
        senderId: user._id,
        receiverId,
        text: text.trim(),
        messageId: res.data._id,
      });

      // If receiver is online, update status after short delay
      if (isUserOnline(receiverId)) {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === res.data._id ? { ...msg, status: 'delivered' } : msg
            )
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  // =============================
  // HANDLE TYPING
  // =============================
  const handleTyping = () => {
    const receiverId = currentChat?.members.find(
      (m) => m._id !== user._id
    )?._id;

    getSocket()?.emit("typing", {
      senderId: user._id,
      receiverId,
    });
  };

  // =============================
  // CHECK ONLINE
  // =============================
  const isUserOnline = (userId) =>
    onlineUsers.includes(userId);

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current chat friend
  const currentChatFriend = currentChat?.members.find(
    (m) => m._id !== user._id
  );

  // Format time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Message status component
  const MessageStatus = ({ status }) => {
    switch(status) {
      case 'sent':
        return <span className="text-[11px] text-gray-400">✓</span>;
      case 'delivered':
        return <span className="text-[11px] text-gray-500">✓✓</span>;
      case 'seen':
        return <span className="text-[11px] text-blue-500">✓✓</span>;
      case 'failed':
        return <span className="text-[11px] text-red-500">! Failed</span>;
      default:
        return null;
    }
  };

  const startCall = (type) => {
    setSelectedCallType(type);
    setShowCallModal(true);
  };

  const acceptCall = () => {
    setSelectedCallType(callTypeIncoming);
    setShowCallModal(true);

    // clear AFTER modal opens
    setTimeout(() => {
      setIncomingCall(null);
    }, 0);
  };


  const rejectCall = () => {
    getSocket()?.emit("endCall", {
      toUserId: incomingCall.fromUserId,
    });
    setIncomingCall(null);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Left Sidebar */}
      <div 
        className={`
          fixed md:relative z-40 h-full w-full md:w-80 bg-white shadow-xl 
          transition-transform duration-300 ease-in-out
          ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        `}
      >
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-white text-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg">
                {user?.firstName?.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-indigo-100">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "inbox"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "users"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Users
          </button>
        </div>

        {/* Conversation/User List */}
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          {activeTab === "inbox" ? (
            conversations.length > 0 ? (
              conversations.map((conv) => {
                const friend = conv.members.find((m) => m._id !== user._id);
                const isSelected = selectedUserId === friend?._id;
                
                return (
                  <div
                    key={conv._id}
                    onClick={(e) => openChatWithUser(friend, e)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                      isSelected && !isMobile
                        ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white flex items-center justify-center font-semibold shadow-md">
                        {friend?.firstName?.charAt(0)}
                      </div>
                      {isUserOnline(friend?._id) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-800">{friend?.firstName}</p>
                        <p className="text-xs text-gray-400">
                          {conv.updatedAt ? formatMessageTime(conv.updatedAt) : ''}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                        {unreadCounts[conv._id] > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCounts[conv._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400 mt-1">Start chatting with someone</p>
              </div>
            )
          ) : (
            filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div 
                    className="flex-1 flex items-center gap-3"
                    onClick={(e) => openChatWithUser(u, e)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white flex items-center justify-center font-semibold shadow-md">
                        {u.firstName?.charAt(0)}
                      </div>
                      {isUserOnline(u._id) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => openChatWithUser(u, e)}
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Chat
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">No users found</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className={`
        flex-1 flex flex-col bg-gray-50
        ${isMobile && sidebarOpen ? 'hidden' : 'flex'}
      `}>
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                {/* Back button - only visible on mobile */}
                {isMobile && (
                  <button
                    onClick={goBackToSidebar}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold shadow-md">
                    {currentChatFriend?.firstName?.charAt(0)}
                  </div>
                  {isUserOnline(currentChatFriend?._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="font-bold text-gray-800">
                    {currentChatFriend?.firstName} {currentChatFriend?.lastName}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {typingUser === currentChatFriend?._id ? (
                      <span className="text-indigo-600">Typing...</span>
                    ) : isUserOnline(currentChatFriend?._id) ? (
                      <span className="text-green-600">● Online</span>
                    ) : (
                      <span className="text-gray-400">○ Offline</span>
                    )}
                  </p>
                </div>

                {/* Call buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => startCall("audio")}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-all"
                    title="Audio Call"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => startCall("video")}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-all"
                    title="Video Call"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.sender === user._id || msg.sender?._id === user._id;
                  const showStatus = isOwnMessage && index === messages.length - 1;
                  
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : ''}`}>
                        <div
                          className={`relative rounded-2xl px-4 py-2 ${
                            isOwnMessage 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                          }`}
                        >
                          <p className="text-sm break-words pr-12">{msg.text}</p>
                          
                          {/* Time and Status */}
                          <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${
                            isOwnMessage ? 'text-indigo-200' : 'text-gray-400'
                          }`}>
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isOwnMessage && (
                              <MessageStatus status={msg.status || 'sent'} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleSend(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  onInput={handleTyping}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    if (input.value.trim()) {
                      handleSend(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          // No chat selected - show welcome screen
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Your Messages</h3>
            <p className="text-gray-400 mb-4">Select a conversation to start chatting</p>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
              >
                View Conversations
              </button>
            )}
          </div>
        )}
      </div>

      {/* Incoming Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl text-center w-80">
            <h2 className="text-lg font-semibold mb-4">
              Incoming {callTypeIncoming} Call
            </h2>

            <div className="flex justify-center gap-6">
              <button
                onClick={acceptCall}
                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors"
              >
                Accept
              </button>

              <button
                onClick={rejectCall}
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <CallModal
          user={user}
          friend={
            incomingCall
              ? { _id: incomingCall.fromUserId }
              : currentChatFriend
          }
          callType={
            incomingCall ? callTypeIncoming : selectedCallType
          }
          incomingOffer={incomingCall?.offer || null}
          isOpen={showCallModal}
          onClose={() => {
            setShowCallModal(false);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}