import React, { useEffect, useState, useRef } from "react";
import { 
  Search, Heart, MessageCircle, Home, Compass, Bell, 
  Mail, Users, TrendingUp, Sparkles, Send, Bookmark, 
  MoreHorizontal, User, Image, Video, X, Grid3X3,
  Users as UsersIcon, MapPin, Hash, Film, Music, 
  Smile, Play, Volume2, VolumeX, Pause, ExternalLink
} from "lucide-react";
import axiosClient from "../utils/axiosClient";
import Kamsa from '../assets/kamsalogo.png';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";

function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [muted, setMuted] = useState(true);
  
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const videoRefs = useRef({});

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      const [postsRes, topicsRes, usersRes] = await Promise.all([
        axiosClient.get("/posts/explore"),
        axiosClient.get("/posts/trending"),
        axiosClient.get("/users/suggested")
      ]);
      
      setPosts(postsRes.data.posts || postsRes.data || []);
      setTrendingTopics(topicsRes.data.topics || topicsRes.data || []);
      setSuggestedUsers(usersRes.data.users || usersRes.data || []);
      
      // Mock data if API doesn't return
      if (!trendingTopics.length) {
        setTrendingTopics([
          { tag: "#trending", posts: 15400 },
          { tag: "#viral", posts: 12800 },
          { tag: "#photography", posts: 9800 },
          { tag: "#travel", posts: 7600 },
          { tag: "#fashion", posts: 5400 },
          { tag: "#food", posts: 3200 },
        ]);
      }
      
      if (!suggestedUsers.length) {
        setSuggestedUsers([
          { _id: "1", username: "travel_diaries", name: "Travel Diaries", followers: "2.4M", isFollowing: false },
          { _id: "2", username: "foodie_guru", name: "Foodie Guru", followers: "1.8M", isFollowing: false },
          { _id: "3", username: "fashion_forward", name: "Fashion Forward", followers: "3.2M", isFollowing: true },
          { _id: "4", username: "tech_reviews", name: "Tech Reviews", followers: "1.2M", isFollowing: false },
        ]);
      }
    } catch (err) {
      console.error("Explore fetch failed", err);
      // Set mock data on error
      setPosts(mockPosts);
      setTrendingTopics(mockTopics);
      setSuggestedUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {    
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleFollow = async (userId) => {
    try {
      await axiosClient.post(`/users/${userId}/follow`);
      setSuggestedUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: true, followers: formatNumber(parseInt(user.followers) + 1) }
            : user
        )
      );
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axiosClient.put(`/posts/${postId}/like`);
      setPosts(prev => 
        prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likesCount: post.likesCount + 1,
                isLiked: true 
              } 
            : post
        )
      );
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleVideoPlay = (postId) => {
    if (playingVideo === postId) {
      setPlayingVideo(null);
      if (videoRefs.current[postId]) {
        videoRefs.current[postId].pause();
      }
    } else {
      Object.keys(videoRefs.current).forEach(id => {
        if (videoRefs.current[id]) videoRefs.current[id].pause();
      });
      setPlayingVideo(postId);
      if (videoRefs.current[postId]) {
        videoRefs.current[postId].play().catch(console.error);
      }
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const openMediaModal = (post) => {
    setSelectedMedia(post);
    if (post.mediaType === 'video' && videoRefs.current[post._id]) {
      videoRefs.current[post._id].play();
    }
  };

  // Mock data for development
  const mockPosts = [
    { _id: '1', mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', mediaType: 'image', likesCount: 24500, commentsCount: 1200, caption: "Beautiful mountain view at sunrise", user: { username: 'nature_lover', profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' } },
    { _id: '2', mediaUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba', mediaType: 'video', likesCount: 18700, commentsCount: 890, caption: "Night sky time-lapse", user: { username: 'astrophotography', profilePic: 'https://images.unsplash.com/photo-1494790108755-2616b612b786' } },
    { _id: '3', mediaUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963', mediaType: 'image', likesCount: 32100, commentsCount: 2100, caption: "Street photography moments", user: { username: 'street_photo', profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e' } },
    { _id: '4', mediaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591', mediaType: 'image', likesCount: 15600, commentsCount: 760, caption: "Delicious homemade pizza", user: { username: 'food_diary', profilePic: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5' } },
    { _id: '5', mediaUrl: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77', mediaType: 'video', likesCount: 8900, commentsCount: 450, caption: "Travel vlog: Tokyo streets", user: { username: 'travel_vlogs', profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' } },
    { _id: '6', mediaUrl: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd', mediaType: 'image', likesCount: 43200, commentsCount: 3400, caption: "Tech gadget unboxing", user: { username: 'tech_review', profilePic: 'https://images.unsplash.com/photo-1507591064344-4c6ce005-128' } },
    { _id: '7', mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', mediaType: 'image', likesCount: 27800, commentsCount: 1500, caption: "Fashion week highlights", user: { username: 'fashion_blog', profilePic: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91' } },
    { _id: '8', mediaUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0', mediaType: 'video', likesCount: 16700, commentsCount: 920, caption: "Workout routine tutorial", user: { username: 'fitness_coach', profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' } },
  ];

  const mockTopics = [
    { tag: "#trending", posts: 15400 },
    { tag: "#viral", posts: 12800 },
    { tag: "#photography", posts: 9800 },
    { tag: "#travel", posts: 7600 },
    { tag: "#fashion", posts: 5400 },
    { tag: "#food", posts: 3200 },
    { tag: "#fitness", posts: 2800 },
    { tag: "#music", posts: 4100 },
  ];

  const mockUsers = [
    { _id: "1", username: "travel_diaries", name: "Travel Diaries", profilePic: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', followers: "2.4M", isFollowing: false },
    { _id: "2", username: "foodie_guru", name: "Foodie Guru", profilePic: 'https://images.unsplash.com/photo-1513104890138-7c749659a591', followers: "1.8M", isFollowing: false },
    { _id: "3", username: "fashion_forward", name: "Fashion Forward", profilePic: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', followers: "3.2M", isFollowing: true },
    { _id: "4", username: "tech_reviews", name: "Tech Reviews", profilePic: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd', followers: "1.2M", isFollowing: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-black border-r border-gray-800 p-6 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img src={Kamsa} alt="Kamsa" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            KAMSA
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { icon: Home, label: 'Home', to: '/', id: 'home' },
            { icon: Search, label: 'Search', to: '/search', id: 'search' },
            { icon: Compass, label: 'Explore', to: '/explore', id: 'explore' },
            { icon: Bell, label: 'Notifications', to: '/notifications', id: 'notifications' },
            { icon: Mail, label: 'Messages', to: '/messages', id: 'messages' },
            { icon: Bookmark, label: 'Saved', to: '/saved', id: 'saved' },
            { icon: Grid3X3, label: 'Posts', to: '/posts', id: 'posts' },
            { icon: UsersIcon, label: 'Friends', to: '/friends', id: 'friends' },
            { icon: User, label: 'Profile', to: `/profile/${user?._id}`, id: 'profile' },
          ].map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-3 rounded-lg transition-all hover:bg-gray-900 ${
                  isActive ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' : ''
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 mb-3">
            {user?.profilePic ? (
              <img src={user.profilePic} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.firstName || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">@{user?.username || user?.email?.split('@')[0] || 'user'}</p>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search photos, videos, and people"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-6">
              <button className="p-2 hover:bg-gray-800 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-4">
          {/* Trending Topics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic, index) => (
                <button
                  key={index}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400 transition-all flex items-center gap-2"
                >
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">{topic.tag}</span>
                  <span className="text-gray-400 text-sm">{formatNumber(topic.posts)} posts</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Featured Posts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {posts.slice(0, 6).map((post) => (
                  <div
                    key={post._id}
                    className="relative group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 cursor-pointer"
                    onClick={() => openMediaModal(post)}
                  >
                    {post.mediaType === 'video' ? (
                      <div className="relative aspect-square">
                        <video
                          ref={el => videoRefs.current[post._id] = el}
                          src={post.mediaUrl}
                          className="w-full h-full object-cover"
                          muted={muted}
                          loop
                          playsInline
                          onMouseEnter={() => {
                            if (videoRefs.current[post._id]) {
                              videoRefs.current[post._id].play();
                            }
                          }}
                          onMouseLeave={() => {
                            if (videoRefs.current[post._id] && playingVideo !== post._id) {
                              videoRefs.current[post._id].pause();
                            }
                          }}
                        />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoPlay(post._id);
                              }}
                              className="p-2 bg-black/50 rounded-full backdrop-blur-sm"
                            >
                              {playingVideo === post._id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMuted(!muted);
                              }}
                              className="p-2 bg-black/50 rounded-full backdrop-blur-sm"
                            >
                              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(post._id);
                              }}
                              className="flex items-center gap-1 p-2 bg-black/50 rounded-full backdrop-blur-sm"
                            >
                              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="text-xs font-medium">{formatNumber(post.likesCount)}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.caption}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {post.user?.profilePic ? (
                          <img 
                            src={post.user.profilePic} 
                            alt={post.user.username}
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                            {post.user?.username?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">@{post.user?.username}</p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2">{post.caption}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs font-medium">{formatNumber(post.likesCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">{formatNumber(post.commentsCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-xs font-medium">{formatNumber(post.shares || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggested Users */}
              <div className="bg-gray-900/50 rounded-2xl p-6 mb-8 border border-gray-800">
                <h3 className="text-xl font-bold mb-4">Suggested for you</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser._id} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-purple-500 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={suggestedUser.profilePic} 
                          alt={suggestedUser.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{suggestedUser.name}</p>
                          <p className="text-gray-400 text-sm">@{suggestedUser.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-400">Followers</p>
                          <p className="font-semibold">{suggestedUser.followers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Posts</p>
                          <p className="font-semibold">{formatNumber(Math.floor(Math.random() * 1000) + 100)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(suggestedUser._id)}
                        className={`w-full py-2 rounded-lg font-medium transition-all ${
                          suggestedUser.isFollowing
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        }`}
                      >
                        {suggestedUser.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* More Posts Grid */}
              <div>
                <h3 className="text-xl font-bold mb-4">Discover More</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {posts.slice(6).map((post) => (
                    <div
                      key={post._id}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-gray-900 cursor-pointer"
                      onClick={() => openMediaModal(post)}
                    >
                      {post.mediaType === 'video' ? (
                        <div className="relative w-full h-full">
                          <video
                            src={post.mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                          />
                          <div className="absolute top-2 right-2 p-1 bg-black/50 rounded backdrop-blur-sm">
                            <Film className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="w-5 h-5" />
                            <span className="font-semibold">{formatNumber(post.likesCount)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-semibold">{formatNumber(post.commentsCount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex flex-col lg:flex-row h-full">
              <div className="lg:w-2/3">
                {selectedMedia.mediaType === 'video' ? (
                  <video
                    src={selectedMedia.mediaUrl}
                    className="w-full h-full max-h-[70vh] object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={selectedMedia.mediaUrl}
                    alt={selectedMedia.caption}
                    className="w-full h-full max-h-[70vh] object-contain"
                  />
                )}
              </div>
              
              <div className="lg:w-1/3 p-6 border-t lg:border-t-0 lg:border-l border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  {selectedMedia.user?.profilePic ? (
                    <img 
                      src={selectedMedia.user.profilePic} 
                      alt={selectedMedia.user.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                      {selectedMedia.user?.username?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">@{selectedMedia.user?.username}</p>
                    <p className="text-gray-400 text-sm">{selectedMedia.user?.name}</p>
                  </div>
                  <button className="text-purple-400 font-semibold">Follow</button>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm whitespace-pre-line">{selectedMedia.caption}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedMedia.tags?.map((tag, index) => (
                      <span key={index} className="text-purple-400 text-sm">#{tag}</span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleLike(selectedMedia._id)}
                        className="flex items-center gap-2"
                      >
                        <Heart className={`w-6 h-6 ${selectedMedia.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{formatNumber(selectedMedia.likesCount)}</span>
                      </button>
                      <button className="flex items-center gap-2">
                        <MessageCircle className="w-6 h-6" />
                        <span>{formatNumber(selectedMedia.commentsCount)}</span>
                      </button>
                      <button className="flex items-center gap-2">
                        <Send className="w-6 h-6" />
                        <span>{formatNumber(selectedMedia.shares || 0)}</span>
                      </button>
                    </div>
                    <button>
                      <Bookmark className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Smile className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
                      />
                      <button className="text-purple-400 font-semibold text-sm">Post</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Explore;