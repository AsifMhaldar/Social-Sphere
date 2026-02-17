import { useEffect, useState } from "react";
import API from "../utils/axiosClient";
import PostItem from "../Components/PostItem";
import PostUpload from "../Components/PostUpload";
import { useSelector } from "react-redux";
import SocialSphere from "../assets/socialsphere.png";
import { NavLink, useNavigate } from "react-router-dom"; // Add useNavigate
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
  const navigate = useNavigate(); // Add this for navigation
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

  // Function to handle navigation to messages
  const goToMessages = () => {
    navigate('/messages');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile Header */}
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
            <img src={SocialSphere} className="w-8 h-8" alt="logo" />
            <span className="font-bold">SocialSphere</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={goToMessages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Messages"
            >
              <Sparkles />
            </button>
            <button 
              onClick={goToMessages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Messages"
            >
              <Send />
              {/* Optional: Add unread message indicator */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-0 w-64 h-screen bg-white shadow-lg z-40 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg ${
                    isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed left-0 top-0 w-72 h-screen bg-white border-r p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <img src={SocialSphere} className="w-10 h-10 rounded-xl" alt="logo" />
            <h1 className="text-2xl font-bold">SocialSphere</h1>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-100"
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <NavLink to={`/profile/${user?._id}`} className="pt-6 border-t mt-6 block">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              {user?.profilePic ? (
                <img src={user.profilePic} className="w-10 h-10 rounded-full object-cover" alt="profile" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white flex items-center justify-center font-bold">
                  {user?.firstName?.[0] || user?.username?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user?.username || "user"}
                </p>
              </div>
              <MoreHorizontal size={18} className="text-gray-500" />
            </div>
          </NavLink>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 lg:ml-72 pt-24 lg:pt-6">
          <main className="max-w-4xl mx-auto p-4">
            {isAuthenticated ? (
              <PostUpload onUpload={(p) => setPosts((prev) => [p, ...prev])} />
            ) : (
              <NavLink to="/login" className="text-blue-600 hover:underline">
                Login to post
              </NavLink>
            )}

            {fetchError && (
              <div className="bg-red-50 p-4 rounded-lg text-red-600 my-4">
                {fetchError}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No posts yet. Be the first to post!
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
        <div className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 ${
                  isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}