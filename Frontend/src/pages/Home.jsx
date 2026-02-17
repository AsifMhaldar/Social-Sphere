import { useEffect, useState } from "react";
import API from "../utils/axiosClient";
import PostItem from "../Components/PostItem";
import PostUpload from "../Components/PostUpload";
import { useSelector } from "react-redux";
import SocialSphere from "../assets/socialsphere.png";
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
  LogOut,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, isAuthenticated } = useSelector((s) => s.auth);

  // ======================
  // Fetch Feed
  // ======================
  const fetchFeed = async () => {
    setFetchError(null);
    try {
      const res = await API.get("/posts/feed");
      if (!Array.isArray(res.data)) {
        setPosts([]);
        return;
      }
      setPosts(res.data);
    } catch (err) {
      setFetchError(
        err.response?.data?.message || err.message || "Failed to load feed"
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ======================
  // Post actions
  // ======================
  const handleLike = async (postId) => {
    try {
      const res = await API.put(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likesCount: res.data.likesCount, isLiked: res.data.liked }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ======================
  // Navigation
  // ======================
  const goToMessages = () => {
    navigate('/messages');
  };

  const navItems = [
    { icon: HomeIcon, label: "Home", to: "/home" },
    { icon: SearchIcon, label: "Search", to: "/search" },
    { icon: Compass, label: "Explore", to: "/explore" },
    { icon: Bell, label: "Notifications", to: "/notifications" },
    { icon: Mail, label: "Messages", to: "/messages" },
    { icon: Bookmark, label: "Saved", to: "/saved" },
    { icon: Grid3X3, label: "Posts", to: "/posts" },
    { icon: Users, label: "Friends", to: "/friends" },
    { icon: User, label: "Profile", to: `/profile/${user?._id}` },
  ];

  const bottomNavItems = [
    { icon: HomeIcon, label: "Home", to: "/home" },
    { icon: SearchIcon, label: "Search", to: "/search" },
    { icon: Compass, label: "Explore", to: "/explore" },
    { icon: Bell, label: "Notifications", to: "/notifications" },
    { icon: User, label: "Profile", to: `/profile/${user?._id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile Header */}
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b transition-shadow ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <img src={SocialSphere} className="w-8 h-8 rounded-lg" alt="SocialSphere logo" />
            <span className="font-bold text-lg">SocialSphere</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={goToMessages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Messages"
            >
              <Sparkles size={22} />
            </button>
            <button 
              onClick={goToMessages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Messages"
            >
              <Send size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] bg-white shadow-xl z-40 overflow-y-auto animate-slide-in">
            <div className="p-4">
              {/* User Profile Section in Mobile Menu */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {user?.profilePic ? (
                    <img 
                      src={user.profilePic} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" 
                      alt="profile" 
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white flex items-center justify-center font-bold text-lg shadow">
                      {user?.firstName?.[0] || user?.username?.[0] || "U"}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {user?.firstName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{user?.username || "user"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-blue-50 text-blue-600 font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Logout Button */}
              <button className="w-full flex items-center gap-3 px-4 py-3 mt-6 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed left-0 top-0 w-72 h-screen bg-white border-r shadow-sm overflow-y-auto">
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <img 
                src={SocialSphere} 
                className="w-10 h-10 rounded-xl shadow-md" 
                alt="SocialSphere logo" 
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SocialSphere
              </h1>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 mb-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-medium border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100 hover:pl-6"
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Profile Card */}
            <NavLink 
              to={`/profile/${user?._id}`} 
              className="block mt-auto border-t pt-6"
            >
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-shadow">
                {user?.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" 
                    alt="profile" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white flex items-center justify-center font-bold text-lg shadow">
                    {user?.firstName?.[0] || user?.username?.[0] || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{user?.username || "user"}
                  </p>
                </div>
                <MoreHorizontal size={18} className="text-gray-400" />
              </div>
            </NavLink>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-72 pt-16 lg:pt-6">
          <main className="max-w-2xl xl:max-w-4xl mx-auto px-4 py-4">
            {/* Post Upload Section */}
            <div className="mb-6">
              {isAuthenticated ? (
                <PostUpload onUpload={(p) => setPosts((prev) => [p, ...prev])} />
              ) : (
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <p className="text-gray-600 mb-3">Login to share your thoughts</p>
                  <NavLink 
                    to="/login" 
                    className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-md transition-shadow"
                  >
                    Login
                  </NavLink>
                </div>
              )}
            </div>

            {/* Error Message */}
            {fetchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
                {fetchError}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📷</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Posts Yet</h3>
                <p className="text-gray-500">Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostItem
                    key={post._id}
                    post={post}
                    onLike={() => handleLike(post._id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:text-blue-600"
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Add padding bottom for mobile to account for bottom nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}