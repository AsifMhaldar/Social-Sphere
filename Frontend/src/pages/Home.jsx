import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../authSlice';
import { Home, Compass, Bell, Mail, Users, TrendingUp, Sparkles, Zap, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Search, Settings, User, Image, Video, BarChart3, X } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import Kamsa from '../assets/kamsalogo.png';
import { NavLink } from 'react-router';

function HomePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
    fetchTrending();
    fetchSuggestedUsers();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/posts/feed');
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await axiosClient.get('/posts/trending');
      setTrendingTopics(response.data.trending || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const response = await axiosClient.get('/user/suggestions');
      setSuggestedUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    try {
      const payload = {
        content: postContent,
        image: postImage || undefined
      };
      
      const response = await axiosClient.post('/posts/create', payload);
      
      // Add new post to the top of feed
      setPosts([response.data.post, ...posts]);
      
      // Reset form
      setPostContent('');
      setPostImage('');
      setShowImageInput(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await axiosClient.post(`/posts/${postId}/like`);
      
      // Update post in state
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes?.includes(user._id);
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user._id)
              : [...(post.likes || []), user._id]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      await axiosClient.post(`/user/${userId}/follow`);
      
      // Remove from suggested users
      setSuggestedUsers(suggestedUsers.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Navigation Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            {/* <Sparkles className="w-6 h-6 text-white" />  */}
            <img src={Kamsa} alt="Kamsa Empire" className='rounded-full border' />
          </div>
          <h1 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            KAMSA
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: Home, label: 'Home', id: 'home' },
            { to:'/explore', icon: Compass, label: 'Explore', id: 'explore' },
            { to:'/notifications', icon: Bell, label: 'Notifications', id: 'notifications' },
            { to:'/messages', icon: Mail, label: 'Messages', id: 'messages' },
            { to:'/community', icon: Users, label: 'Community', id: 'community' },
            { to:'/trending', icon: TrendingUp, label: 'Trending', id: 'trending' },
            { to:'/profile', icon: User, label: 'Profile', id: 'profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`cursor-pointer w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                activeTab === item.id
                  ? 'bg-linear-to-r from-purple-500/20 to-pink-500/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <NavLink to={item.to || '#'} className="flex-1 text-left font-medium">
                {item.label}
              </NavLink>
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
            {user?.profilePic ? (
              <img src={user.profilePic} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.firstName || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">@{user?.email?.split('@')[0] || 'user'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-300 font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 mr-96 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Kamsa Empire..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-300">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Create Post */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex gap-4">
            {user?.profilePic ? (
              <img src={user.profilePic} alt={user.firstName} className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's happening in the Empire?"
                className="w-full bg-transparent text-white placeholder-gray-400 text-lg resize-none focus:outline-none mb-3"
                rows="3"
              />
              
              {showImageInput && (
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    onClick={() => {
                      setShowImageInput(false);
                      setPostImage('');
                    }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreatePost}
                  disabled={!postContent.trim()}
                  className="px-4 py-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Post
                </button>
                <button
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all duration-300"
                >
                  <Image className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {posts.map((post) => (
              <article key={post._id} className="p-6 hover:bg-white/5 transition-all duration-300">
                <div className="flex gap-4">
                  {post.userId?.profilePic ? (
                    <img
                      src={post.userId.profilePic}
                      alt={post.userId.firstName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                      {post.userId?.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{post.userId?.firstName || 'Anonymous'}</h3>
                        <p className="text-gray-400 text-sm">
                          @{post.userId?.email?.split('@')[0] || 'user'} · {formatTimeAgo(post.createdAt)}
                        </p>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-gray-200 mb-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post content"
                        className="w-full rounded-2xl mb-4 border border-white/10 max-h-96 object-cover"
                      />
                    )}

                    <div className="flex items-center gap-6 text-gray-400">
                      <button
                        onClick={() => handleLikePost(post._id)}
                        className={`flex items-center gap-2 transition-colors group ${
                          post.likes?.includes(user._id) ? 'text-pink-400' : 'hover:text-pink-400'
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-all">
                          <Heart className={`w-5 h-5 ${post.likes?.includes(user._id) ? 'fill-current' : ''}`} />
                        </div>
                        <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-all">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-green-400 transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-all">
                          <Share2 className="w-5 h-5" />
                        </div>
                      </button>
                      <button className="ml-auto hover:text-purple-400 transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-purple-500/10 transition-all">
                          <Bookmark className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-96 bg-black/40 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto">
        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Trending in Empire
            </h2>
            <div className="space-y-4">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-all">
                  <p className="text-purple-400 text-sm font-medium">#{topic.tag}</p>
                  <p className="text-gray-400 text-xs mt-1">{topic.posts} posts</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Who to Follow
            </h2>
            <div className="space-y-4">
              {suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser._id} className="flex items-center gap-3">
                  {suggestedUser.profilePic ? (
                    <img
                      src={suggestedUser.profilePic}
                      alt={suggestedUser.firstName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                      {suggestedUser.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{suggestedUser.firstName}</p>
                    <p className="text-gray-400 text-xs truncate">@{suggestedUser.email?.split('@')[0]}</p>
                  </div>
                  <button
                    onClick={() => handleFollowUser(suggestedUser._id)}
                    className="px-4 py-1.5 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default HomePage;