import { useState, useEffect } from "react";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import API from "../utils/axiosClient";

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
  const initial = name?.[0]?.toUpperCase() || "U";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'>
  <rect width='100%' height='100%' fill='%23f3f4f6'/>
  <text x='50%' y='50%' dy='.35em' text-anchor='middle'
  font-family='Inter' font-size='18' fill='%23374151'>${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function PostItem({ post, onLike }) {
  const currentUser = useSelector((s) => s.auth.user);

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // ✅ SHARE STATES
  const [showShare, setShowShare] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sendingTo, setSendingTo] = useState(null);

  const username =
    post?.user?.firstName ||
    post?.user?.username ||
    "Unknown";

  const userId = post?.user?._id;
  const avatar =
    post?.user?.profilePic ||
    generateAvatarDataUrl(username);

  const timeLabel = post?.createdAt
    ? timeAgo(new Date(post.createdAt))
    : "";

  // =========================
  // Fetch Comments
  // =========================
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await API.get(`/comments/${post._id}`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments");
    } finally {
      setLoadingComments(false);
    }
  };

  // =========================
  // Add Comment
  // =========================
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await API.post(`/comments/${post._id}`, {
        text: commentText.trim(),
      });

      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
      setShowComments(true);
    } catch (err) {
      console.error("Comment failed");
    }
  };

  // =========================
  // Delete Comment
  // =========================
  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId)
      );
    } catch (err) {
      console.error("Delete failed");
    }
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  // =========================
  // SHARE FEATURE
  // =========================
  useEffect(() => {
    if (showShare) {
      API.get("/profile/getAllProfiles")
        .then((res) => {
          setUsers(
            res.data.filter(
              (u) => u._id !== currentUser?._id
            )
          );
        })
        .catch(() => {});
    }
  }, [showShare, currentUser]);

  const handleShare = async (receiverId) => {
    try {
      setSendingTo(receiverId);

      const convoRes = await API.post("/chat/conversation", {
        receiverId,
      });

      await API.post("/chat/message", {
        conversationId: convoRes.data._id,
        postId: post._id,
      });

      setTimeout(() => {
        setSendingTo(null);
        setShowShare(false);
      }, 800);

    } catch (err) {
      console.error("Share failed");
      setSendingTo(null);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 p-3">
        <img
          src={avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1">
          {userId ? (
            <NavLink
              to={`/getUserProfile/${userId}`}
              className="font-semibold text-gray-900 hover:text-blue-600"
            >
              {username}
            </NavLink>
          ) : (
            <span className="font-semibold">{username}</span>
          )}
          <p className="text-xs text-gray-500">{timeLabel}</p>
        </div>
      </div>

      {/* MEDIA */}
      {post?.mediaUrl && (
        <div className="bg-black/5">
          {post.mediaType === "image" ? (
            <img
              src={post.mediaUrl}
              alt="post"
              className="w-full object-cover max-h-[70vh]"
            />
          ) : (
            <video
              src={post.mediaUrl}
              controls
              className="w-full object-contain max-h-[70vh]"
            />
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onLike} className="flex items-center gap-2">
            <Heart
              className={`w-5 h-5 cursor-pointer ${
                post?.isLiked
                  ? "text-red-500 fill-red-500"
                  : "text-gray-700"
              }`}
            />
            <span>{post?.likesCount ?? 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5 text-gray-600 cursor-pointer" />
            <span>{comments.length}</span>
          </button>

          <Share2
            className="w-5 h-5 text-gray-600 cursor-pointer"
            onClick={() => setShowShare(true)}
          />
        </div>

        {/* CAPTION */}
        <p className="text-sm mb-3">
          <span className="font-semibold mr-2">
            {username}
          </span>
          {post?.caption}
        </p>

        {/* COMMENTS */}
        {showComments && (
          <div className="border-t pt-3 space-y-3">
            {loadingComments ? (
              <p className="text-xs text-gray-400">
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400">
                No comments yet
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id}
                  className="flex justify-between items-center text-sm group"
                >
                  <div>
                    <strong>{c.user?.firstName}</strong>{" "}
                    {c.text}
                  </div>

                  {c.user?._id === currentUser?._id && (
                    <button
                      onClick={() =>
                        handleDeleteComment(c._id)
                      }
                      className="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}

            <div className="flex gap-2 mt-3">
              <input
                value={commentText}
                onChange={(e) =>
                  setCommentText(e.target.value)
                }
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Add a comment..."
              />
              <button
                onClick={handleCommentSubmit}
                className="text-sm text-blue-600 font-medium cursor-pointer"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SHARE MODAL */}
      {showShare && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Share</h3>
              <button
                onClick={() => setShowShare(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Search..."
              className="w-full border px-3 py-2 rounded-lg mb-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="max-h-80 overflow-y-auto space-y-2">
              {users
                .filter((u) =>
                  u.firstName
                    ?.toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u._id}
                    className="flex justify-between items-center p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <span>{u.firstName}</span>

                    <button
                      disabled={sendingTo === u._id}
                      onClick={() => handleShare(u._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm disabled:opacity-50"
                    >
                      {sendingTo === u._id
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
