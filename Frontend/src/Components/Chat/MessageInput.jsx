import { useState, useRef, useEffect } from "react";

export default function MessageInput({ onSend, onTyping, friend }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [friend]);

  const handleTyping = () => {
    if (!isTyping && onTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && onTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    onSend(text.trim());
    setText("");
    
    // Reset typing state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && onTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick replies suggestions
  const quickReplies = ['👍', '👋', '😊', 'Thanks!', 'Okay', 'Sure'];

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Quick replies (mobile) */}
      <div className="flex overflow-x-auto py-2 px-4 gap-2 hide-scrollbar md:hidden">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => setText(prev => prev + ' ' + reply)}
            className="flex-shrink-0 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 md:p-4">
        <div className="flex items-end gap-2 md:gap-3">
          {/* Attachment button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all transform hover:scale-110"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Attachments popup */}
            {showAttachments && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[150px] animate-slideUp">
                <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-xl">📷</span>
                  <span className="text-sm">Photo</span>
                </button>
                <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-xl">🎥</span>
                  <span className="text-sm">Video</span>
                </button>
                <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-xl">📎</span>
                  <span className="text-sm">File</span>
                </button>
              </div>
            )}
          </div>

          {/* Emoji button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-all transform hover:scale-110"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Emoji picker (simplified) */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-slideUp">
                <div className="grid grid-cols-6 gap-2">
                  {['😊', '😂', '❤️', '👍', '🔥', '😍', '🎉', '✨', '💯', '🙏', '😭', '🥺'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setText(prev => prev + emoji)}
                      className="text-xl hover:bg-gray-100 p-1 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${friend?.firstName || 'user'}...`}
              className="w-full px-4 py-2.5 md:px-5 md:py-3 bg-gray-100 rounded-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-12"
            />
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!text.trim()}
            className={`
              p-2.5 md:px-6 md:py-2.5 rounded-full font-medium transition-all transform
              flex items-center justify-center
              ${text.trim()
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:scale-105'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <span className="hidden md:inline">Send</span>
            <svg className="w-5 h-5 md:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>

      {/* Add these styles */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}