import { useEffect, useState } from "react";
import API from "../utils/axiosClient";
import PostItem from "../Components/PostItem";
import PostUpload from "../Components/PostUpload";

import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../authSlice";
import kamsa from '../assets/kamsalogo.png'
import { NavLink } from "react-router";

export default function Home() {
  const dispatch = useDispatch();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const { user, isAuthenticated } = useSelector((s) => s.auth);

  const fetchFeed = async () => {
    setFetchError(null);
    try {
      const res = await API.get("/posts/feed");
      const data = res.data;
      if (!Array.isArray(data)) {
        console.warn("Unexpected feed payload:", data);
        setPosts([]);
        return;
      }
      setPosts(data);
    } catch (err) {
      console.error('fetchFeed error:', err.response || err.message || err);
      const msg = err.response?.data?.message || err.message || "Failed to load feed";
      setFetchError(msg);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await API.put(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likesCount: res.data.likesCount, isLiked: res.data.liked } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, comment) => {
    if (!comment) return;
    try {
      await API.post(`/posts/${postId}/comment`, { comment });
      // Optionally refresh comments or optimistic update
    } catch (err) {
      console.error(err);
    }
  };

  // upload helpers
  const onFileChange = (e) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setUploadError("Please select an image or a video file.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("media", selectedFile);
      formData.append("caption", caption || "");

      const res = await API.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // prepend new post to feed
      setPosts((prev) => [res.data, ...prev]);

      // reset UI
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
      <section>
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src={kamsa}
              alt="Kamsa logo"
              title="Kamsa"
              className="w-16 h-16 md:w-24 md:h-24 object-contain"
              loading="lazy"
            />
          </a>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.profilePic ? (
                  <img src={user.profilePic} alt={`${user.firstName} avatar`} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {user.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}

                <NavLink to={`/profile/${user._id}`} className="text-sm text-gray-700"><strong>{user.firstName}</strong></NavLink>
                <button onClick={() => dispatch(logoutUser())} className="text-sm text-red-600">Logout</button>
              </>
            ) : (
              <span className="text-sm text-gray-500"></span>
            )}
          </div>
        </div>

        {/* Upload component (only show when authenticated) */}
        {isAuthenticated ? (
          <PostUpload onUpload={(post) => setPosts((prev) => [post, ...prev])} />
        ) : (
          <div className="bg-white rounded-xl shadow p-4 mb-4 text-center text-sm text-gray-700">
            <p>Please log in to post and see your personalized feed.</p>
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
            <p>Could not load feed: {fetchError}</p>
            <button onClick={fetchFeed} className="mt-2 bg-red-600 text-white px-3 py-1 rounded">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-48 bg-gray-200 rounded mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostItem
                key={post._id}
                post={post}
                onLike={() => handleLike(post._id)}
                onComment={(comment) => handleComment(post._id, comment)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Right sidebar (visible on md+) */}
      <aside className="hidden md:block">
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <p className="font-semibold">Suggested</p>
          <p className="text-sm text-gray-500">People to follow</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="font-semibold">About</p>
          <p className="text-sm text-gray-500">This is a sample Instagram-style feed.</p>
        </div>
      </aside>
    </main>
  );
}