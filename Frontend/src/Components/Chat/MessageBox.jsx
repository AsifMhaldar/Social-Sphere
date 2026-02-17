import { useEffect, useRef } from "react";

export default function MessageBox({ messages, currentUser, loading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Message status icons
  const MessageStatus = ({ status }) => {
    switch (status) {
      case 'seen':
        return (
          <div className="flex items-center gap-0.5">
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
          <div className="flex items-center gap-0.5">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5zM18.5 10.5l-1.5-1.5-5 5 1.5 1.5 5-5z"/>
            </svg>
            <svg className="w-4 h-4 text-gray-400 -ml-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5z"/>
            </svg>
          </div>
        );
      case 'sent':
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 4.5l-12 12-5-5 1.5-1.5 3.5 3.5 10.5-10.5 1.5 1.5z"/>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f0f2f5]">
      <div className="space-y-3">
        {messages.map((msg, index) => {
          const isOwn = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;

          return (
            <div
              key={msg._id || index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex-shrink-0 shadow-md"></div>
                )}
                
                <div>
                  <div
                    className={`relative group rounded-2xl px-4 py-2 ${
                      isOwn 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none shadow-md' 
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.text}</p>
                    
                    {/* Message Status (only for own messages) */}
                    {isOwn && (
                      <div className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageStatus status={msg.status} />
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-xs text-gray-400 mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    
                    {/* Show status on hover or always for last message */}
                    {isOwn && index === messages.length - 1 && (
                      <span className="ml-1">
                        <MessageStatus status={msg.status} />
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}