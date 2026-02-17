import { useEffect, useRef } from "react";

export default function MessageBox({ messages, currentUser, loading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Message status icons with animations
  const MessageStatus = ({ status }) => {
    switch (status) {
      case 'seen':
        return (
          <div className="flex items-center gap-0.5 animate-fadeIn">
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5zM18.5 10.5l-1.5-1.5-5 5 1.5 1.5 5-5zM12 17.5l-5-5-1.5 1.5 5 5 1.5-1.5z"/>
            </svg>
            <svg className="w-4 h-4 text-blue-500 -ml-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5z"/>
            </svg>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-0.5 animate-fadeIn">
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5zM18.5 10.5l-1.5-1.5-5 5 1.5 1.5 5-5z"/>
            </svg>
            <svg className="w-4 h-4 text-gray-500 -ml-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5z"/>
            </svg>
          </div>
        );
      case 'sent':
      default:
        return (
          <svg className="w-4 h-4 text-gray-400 animate-fadeIn" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5z"/>
          </svg>
        );
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-3 bg-blue-100 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender !== msg.sender);

            return (
              <div
                key={msg._id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slideIn`}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] lg:max-w-[65%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar - only show for consecutive messages from same sender */}
                  {!isOwn && (
                    <div className={`flex-shrink-0 transition-all duration-300 ${showAvatar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      {showAvatar ? (
                        <div className="relative">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm shadow-md">
                            {msg.sender?.firstName?.charAt(0) || 'U'}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10"></div> // Placeholder for alignment
                      )}
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender name for group chats */}
                    {!isOwn && msg.sender?.firstName && showAvatar && (
                      <span className="text-xs font-medium text-gray-500 mb-1 ml-2">
                        {msg.sender.firstName}
                      </span>
                    )}
                    
                    <div className="relative group">
                      <div
                        className={`
                          relative rounded-2xl px-4 py-2.5 break-words
                          ${isOwn 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none shadow-md' 
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                          }
                          transition-all duration-200 hover:shadow-lg
                        `}
                      >
                        <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                        
                        {/* Message status indicator for own messages */}
                        {isOwn && (
                          <div className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageStatus status={msg.status} />
                          </div>
                        )}
                      </div>
                      
                      {/* Time and status */}
                      <div className={`
                        flex items-center gap-1.5 mt-1 px-2
                        ${isOwn ? 'justify-end' : 'justify-start'}
                      `}>
                        <span className="text-[10px] md:text-xs text-gray-400">
                          {formatMessageTime(msg.createdAt || Date.now())}
                        </span>
                        
                        {/* Show status on hover or always for last message */}
                        {isOwn && (index === messages.length - 1 || msg.status === 'seen') && (
                          <span className="ml-1">
                            <MessageStatus status={msg.status} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}