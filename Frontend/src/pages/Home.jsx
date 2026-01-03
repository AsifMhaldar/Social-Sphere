import { useEffect, useState } from "react";
import API from "../utils/axiosClient";
import PostItem from "../Components/PostItem";
import PostUpload from "../Components/PostUpload";
import { useSelector } from "react-redux";
import kamsa from '../assets/kamsalogo.png'
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home as HomeIcon, 
  Search as SearchIcon, 
  Compass, 
  Bell, 
  Mail, 
  Bookmark, 
  Grid3X3,
  Users,
  User,
  MoreHorizontal,
  Sparkles,
  Send,
  Menu,
  X,
  LogOut
} from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeed();
    
    // Handle scroll for header effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Instagram-style sidebar navigation items
  const navItems = [
    { icon: HomeIcon, label: 'Home', to: '/home', id: 'home' },
    { icon: SearchIcon, label: 'Search', to: '/search', id: 'search' },
    { icon: Compass, label: 'Explore', to: '/explore', id: 'explore' },
    { icon: Bell, label: 'Notifications', to: '/notifications', id: 'notifications' },
    { icon: Mail, label: 'Messages', to: '/messages', id: 'messages' },
    { icon: Bookmark, label: 'Saved', to: '/saved', id: 'saved' },
    { icon: Grid3X3, label: 'Posts', to: '/posts', id: 'posts' },
    { icon: Users, label: 'Friends', to: '/friends', id: 'friends' },
    { icon: User, label: 'Profile', to: `/profile/${user?._id}`, id: 'profile' },
  ];

  // Bottom navigation items for mobile
  const bottomNavItems = [
    { icon: HomeIcon, label: 'Home', to: '/home' },
    { icon: SearchIcon, label: 'Search', to: '/search' },
    { icon: Compass, label: 'Explore', to: '/explore' },
    { icon: Bell, label: 'Notifications', to: '/notifications', id: 'notifications' },
    { icon: User, label: 'Profile', to: `/profile/${user?._id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile Header - Fixed on top for mobile */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-all duration-200 ${
        isScrolled ? 'shadow-sm' : ''
      }`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <img src={kamsa} alt="Kamsa" className="w-8 h-8 object-cover" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KAMSA
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Send className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src={kamsa} alt="Kamsa" className="w-10 h-10 rounded-xl object-cover" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    KAMSA
                  </h1>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-4">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.firstName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-gray-500 text-sm truncate">@{user?.username || user?.email?.split('@')[0] || 'user'}</p>
                  </div>
                  <LogOut className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Mobile Navigation Menu */}
            <nav className="p-4 overflow-y-auto h-[calc(100vh-200px)]">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600' 
                          : 'hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
              
              {/* Suggested Section in Mobile Menu */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-4 mb-3">Suggested</p>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-gray-700 text-sm font-bold">
                          U{i}
                        </div>
                        <div>
                          <p className="text-sm font-medium">User {i}</p>
                          <p className="text-xs text-gray-500">Popular creator</p>
                        </div>
                      </div>
                      <button className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Sidebar - Desktop Only */}
        <aside className="hidden lg:block fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={kamsa} alt="Kamsa" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KAMSA
            </h1>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center gap-4 px-4 py-3 rounded-lg transition-all hover:bg-gray-100 ${
                    isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-500' : ''
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-3">
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                  {user?.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.firstName || 'User'}</p>
                <p className="text-gray-500 text-xs truncate">@{user?.username || user?.email?.split('@')[0] || 'user'}</p>
              </div>
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-72 pt-24 lg:pt-0">
          {/* Desktop Header */}
          <header className="hidden lg:block sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search photos, videos, and people"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 ml-6">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Send className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="max-w-4xl mx-auto p-4 lg:p-6">
            {/* User Info for Mobile */}
            <div className="lg:hidden flex items-center justify-between mb-6 pt-4">
              <div className="flex items-center gap-3">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">Welcome back!</p>
                </div>
              </div>
              <NavLink 
                to={`/profile/${user?._id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Profile
              </NavLink>
            </div>

            {/* Upload component */}
            {isAuthenticated ? (
              <PostUpload onUpload={(post) => setPosts((prev) => [post, ...prev])} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 text-center text-sm text-gray-700">
                <p>Please log in to post and see your personalized feed.</p>
                <NavLink to="/login" className="mt-2 inline-block text-blue-600 hover:text-blue-800 font-medium">
                  Click here to login
                </NavLink>
              </div>
            )}

            {fetchError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
                <p>Could not load feed: {fetchError}</p>
                <button onClick={fetchFeed} className="mt-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm">
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="h-48 bg-gray-200 rounded-xl mt-4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
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
          </main>
        </div>

        {/* Right sidebar - Desktop Only */}
        <aside className="hidden lg:block fixed right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search Kamsa"
                className="w-full pl-12 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <p className="font-semibold text-gray-900 mb-4">Suggested for you</p>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-gray-700 font-bold">
                      U{i}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">User {i}</p>
                      <p className="text-xs text-gray-500">Suggested for you</p>
                    </div>
                  </div>
                  <button className="text-xs px-3 py-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg font-medium transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="font-semibold text-gray-900 mb-4">Trending Now</p>
            <div className="space-y-3">
              {["#Kamsa", "#SocialMedia", "#Trending", "#Explore", "#Photography"].map((tag) => (
                <a
                  key={tag}
                  href="#"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-blue-600">{tag}</span>
                  <span className="text-xs text-gray-400">5.2k posts</span>
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
              Connect with friends and share your moments.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation - Fixed at bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center p-2 flex-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      
      {/* Add padding at bottom for mobile bottom nav */}
      <div className="pb-16 lg:pb-0"></div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}