import { useState } from "react";
import { Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react";

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

export default function PostItem({ post, onLike, onComment }) {
  const [commentText, setCommentText] = useState("");

  const username =
    post?.user?.username || (typeof post?.user === "string" ? post.user : "Unknown");
  const avatar = post?.user?.avatar || generateAvatarDataUrl(username);
  const timeLabel = post?.createdAt ? timeAgo(new Date(post.createdAt)) : "";

  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <img src={avatar} alt={`${username} avatar`} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{username}</p>
              <p className="text-xs text-gray-500">{timeLabel}</p>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
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
            <button onClick={onLike} className="flex items-center gap-2">
              <Heart className={`${post?.isLiked ? "text-red-500" : "text-gray-700"} w-5 h-5`} />
              <span className="text-sm">{post?.likesCount ?? 0}</span>
            </button>

            <button className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Comment</span>
            </button>
          </div>

          <button className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="text-sm">
          <span className="font-semibold mr-2">{username}</span>
          <span className="text-gray-800">{post?.caption}</span>
        </p>

        <div className="mt-3">
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Add a comment..."
            />
            <button
              onClick={() => {
                if (commentText.trim()) {
                  onComment(commentText.trim());
                  setCommentText("");
                }
              }}
              className="text-sm text-blue-600"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
