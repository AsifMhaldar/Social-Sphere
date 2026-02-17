import { useState, useRef, useEffect } from "react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-2xl text-gray-500 hover:text-gray-700 transition-colors"
        >
          📷
        </button>
        
        <button
          type="button"
          className="text-2xl text-gray-500 hover:text-gray-700 transition-colors"
        >
          😊
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="w-full px-5 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          
          {isTyping && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs text-blue-500">typing...</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            text.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </form>
  );
}