import React, { useEffect, useState } from "react";
import { Search, Heart, MessageCircle } from "lucide-react";
import axiosClient from "../utils/axiosClient";
import Kamsa from '../assets/kamsalogo.png';
import { NavLink } from 'react-router';
import { Home, Compass, Bell, Mail, Users, TrendingUp, Sparkles, Zap, Share2, Bookmark, MoreHorizontal, Settings, User, Image, Video, BarChart3, X } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";


function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const handleLogout = () => {    
    dispatch(logoutUser());
  };

  

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      const res = await axiosClient.get("/posts/explore");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Explore fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-pink-950 ml-72">
      {/* Header */}

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

      <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Search"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt="explore"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm p-4">
                    {post.content}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 fill-white" />
                    <span className="font-semibold">{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Explore;
