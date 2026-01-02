import { useState, useRef, useEffect } from "react";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { NavLink } from 'react-router-dom'; // Remove useParams

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function generateAvatarDataUrl(name) {
  const initial = (name && name[0]) ? name[0].toUpperCase() : 'U';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, system-ui, -apple-system' font-size='18' fill='%23374151'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function PostItem({ post, onLike, onComment, onEdit }) {
  const [commentText, setCommentText] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [localCaption, setLocalCaption] = useState(post?.caption || "");

  const popoverRef = useRef(null);

  useEffect(() => {
    setLocalCaption(post?.caption || "");
  }, [post?.caption]);

  useEffect(() => {
    function handleOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsPopoverOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
        if (isEditing) {
          setIsEditing(false);
        }
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isEditing]);

  // Get user info from post data
  const username = post?.user?.username || 
                  post?.user?.firstName || 
                  (typeof post?.user === "string" ? post.user : "Unknown");
  
  // Get user ID from post data
  const userId = post?.user?._id || post?.userId;
  
  const avatar = post?.user?.avatar || post?.user?.profilePic || generateAvatarDataUrl(username);
  const timeLabel = post?.createdAt ? timeAgo(new Date(post.createdAt)) : "";

  const startEditing = () => {
    setEditText(localCaption);
    setIsEditing(true);
    setIsPopoverOpen(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditText("");
  };

  const saveEditing = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (onEdit) {
      try {
        onEdit(post?._id, trimmed);
      } catch (err) {
        // swallow - parent may not return a promise
      }
    } else {
      setLocalCaption(trimmed);
    }
    setIsEditing(false);
  };

  // ❌ REMOVED: All profile fetching code (wrong place)
  // const {userId} = useParams(); // ❌ Remove this
  // const [error, setError] = useState(false) // ❌ Remove
  // const [loading, setLoading] = useState(false); // ❌ Remove
  // const [profile, setProfile] = useState(null); // ❌ Remove
  
  // ❌ REMOVED: useEffect with profile fetching

  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <img src={avatar} alt={`${username} avatar`} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              {/* ✅ Use userId from post data, NOT from useParams() */}
              {userId ? (
                <NavLink to={`/getUserProfile/${userId}`} className="font-semibold text-gray-900 hover:text-blue-600">
                  {username}
                </NavLink>
              ) : (
                <span className="font-semibold text-gray-900">{username}</span>
              )}
              <p className="text-xs text-gray-500">{timeLabel}</p>
            </div>
            <div className="relative" ref={popoverRef}>
              {/* Your popover content here */}
            </div>
          </div>
        </div>
      </div>

      {post?.mediaUrl && (
        <div className="bg-black/5">
          {post.mediaType === "image" ? (
            <img src={post.mediaUrl} alt="post" className="w-full object-cover max-h-[70vh]" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full object-contain max-h-[70vh]" />
          )}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={onLike} className="flex items-center gap-2 hover:opacity-80">
              <Heart className={`${post?.isLiked ? "text-red-500 fill-red-500" : "text-gray-700"} w-5 h-5`} />
              <span className="text-sm text-gray-700">{post?.likesCount ?? 0}</span>
            </button>

            <button onClick={() => onComment && onComment("")} className="flex items-center gap-2 hover:opacity-80">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Comment</span>
            </button>
          </div>

          <button className="flex items-center gap-2 hover:opacity-80">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button 
                onClick={saveEditing} 
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Save
              </button>
              <button 
                onClick={cancelEditing} 
                className="text-sm text-gray-600 font-medium hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm">
            <span className="font-semibold mr-2">{username}</span>
            <span className="text-gray-800">{localCaption}</span>
          </p>
        )}

        <div className="mt-3">
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a comment..."
            />
            <button
              onClick={() => {
                if (commentText.trim() && onComment) {
                  onComment(commentText.trim());
                  setCommentText("");
                }
              }}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}