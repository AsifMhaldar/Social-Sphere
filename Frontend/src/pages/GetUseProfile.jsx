import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Camera,
  Film,
  Image as ImageIcon,
  Loader,
  RefreshCw,
  UserPlus,
  UserCheck,
  Users,
  Bookmark,
  Share2,
  Send,
  Settings
} from 'lucide-react';

function GetUserProfile() {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [likingPosts, setLikingPosts] = useState({});
  const [activeTab, setActiveTab] = useState('posts');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userId } = useParams();

  useEffect(() => {
    if (!userId || userId === 'undefined') {
      setError("User ID not found in URL");
      setLoading(false);
      return;
    }
    
    Promise.all([
      fetchProfile(userId),
      fetchUserPosts(userId)
    ]).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  const fetchProfile = async (id) => {
    try {
      const response = await axiosClient.get(`/profile/getUserProfile/${id}`);
      setProfile(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load profile");
    }
  };

  const fetchUserPosts = async (id) => {
    setPostsLoading(true);
    try {
      const response = await axiosClient.get(`/posts/user/${id}/posts`);
      
      let postsData = [];
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && Array.isArray(response.data.posts)) {
        postsData = response.data.posts;
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      try {
        const fallbackResponse = await axiosClient.get(`/profile/getUserPosts/${id}`);
        const fallbackData = fallbackResponse.data.posts || fallbackResponse.data;
        if (Array.isArray(fallbackData)) {
          setPosts(fallbackData);
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    } finally {
      setPostsLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (likingPosts[postId]) return;
    
    setLikingPosts(prev => ({ ...prev, [postId]: true }));
    
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const wasLiked = post.isLiked || false;
            return {
              ...post,
              isLiked: !wasLiked,
              likesCount: wasLiked ? (post.likesCount || 0) - 1 : (post.likesCount || 0) + 1
            };
          }
          return post;
        })
      );

      await axiosClient.put(`/posts/${postId}/like`);
      
    } catch (error) {
      console.error("Error toggling like:", error);
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 0) - 1
            };
          }
          return post;
        })
      );
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleFollow = async () => {
    if (!userId || followLoading) return;
    
    setFollowLoading(true);
    try {
      await axiosClient.post(`/profile/follow/${userId}`);
      
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          isFollowing: true,
          followersCount: (prev.user.followersCount || 0) + 1
        }
      }));
      
    } catch (error) {
      alert(error.response?.data?.message || "Failed to follow user");
      fetchProfile(userId);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!userId || followLoading) return;
    
    setFollowLoading(true);
    try {
      await axiosClient.post(`/profile/unfollow/${userId}`);
      
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          isFollowing: false,
          followersCount: Math.max(0, (prev.user.followersCount || 0) - 1)
        }
      }));
      
    } catch (error) {
      alert(error.response?.data?.message || "Failed to unfollow user");
      fetchProfile(userId);
    } finally {
      setFollowLoading(false);
    }
  };

  const goToMessages = () => {
    navigate('/messages');
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading profile...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Error Loading Profile</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-purple-900/30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white truncate">
            {profile?.user?.firstName || 'Profile'}
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full right-4 mt-2 w-48 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            <button
              onClick={goToMessages}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">Message</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-white transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share Profile</span>
            </button>
            {profile?.isOwnProfile && (
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-white transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Edit Profile</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 lg:py-8">
        {/* Back Button - Desktop */}
        <button
          onClick={goBack}
          className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {profile && (
          <>
            {/* Profile Header */}
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-4 lg:p-8 mb-6 border border-purple-900/30 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="relative">
                    <img 
                      src={profile.user?.profilePic || "https://via.placeholder.com/150"} 
                      alt={`${profile.user?.firstName}'s profile`}
                      className="w-28 h-28 lg:w-36 lg:h-36 rounded-full border-4 border-purple-600 object-cover transition-transform group-hover:scale-105"
                    />
                    {profile.user?.isOnline && (
                      <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 text-center lg:text-left w-full">
                  {/* Name and Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                        {profile.user?.firstName} {profile.user?.lastName}
                      </h1>
                      <p className="text-gray-400 text-sm">@{profile.user?.username || 'username'}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3">
                      {!profile.isOwnProfile ? (
                        <>
                          <button
                            onClick={profile.user?.isFollowing ? handleUnfollow : handleFollow}
                            disabled={followLoading}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 ${
                              profile.user?.isFollowing
                                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/30'
                            }`}
                          >
                            {followLoading ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : profile.user?.isFollowing ? (
                              <>
                                <UserCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Follow</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={goToMessages}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
                          >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Message</span>
                          </button>
                        </>
                      ) : (
                        <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all transform hover:scale-105">
                          <Settings className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit Profile</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex justify-center lg:justify-start gap-6 lg:gap-8 mb-4">
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold text-white">{profile.user?.postCount || posts.length}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold text-white">{profile.user?.followersCount || 0}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold text-white">{profile.user?.followingCount || 0}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">Following</div>
                    </div>
                  </div>
                  
                  {/* Bio */}
                  {profile.user?.bio && (
                    <p className="text-gray-300 text-sm lg:text-base max-w-2xl mx-auto lg:mx-0 mb-4">
                      {profile.user.bio}
                    </p>
                  )}
                  
                  {/* Follow Status */}
                  {profile.user?.isFollowing && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-700/50">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs lg:text-sm text-green-400">You follow this user</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-purple-900/30 mb-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 lg:flex-none px-6 py-3 font-medium text-sm lg:text-base transition-all relative ${
                  activeTab === 'posts'
                    ? 'text-purple-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Posts</span>
                </div>
                {activeTab === 'posts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 lg:flex-none px-6 py-3 font-medium text-sm lg:text-base transition-all relative ${
                  activeTab === 'media'
                    ? 'text-purple-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>Media</span>
                </div>
                {activeTab === 'media' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                )}
              </button>
            </div>

            {/* Posts Section */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg lg:text-xl font-semibold text-white">
                    Posts ({posts.length})
                  </h2>
                  <button 
                    onClick={() => fetchUserPosts(userId)}
                    disabled={postsLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${postsLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{postsLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
                
                {postsLoading ? (
                  <div className="text-center py-12">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 bg-purple-500/20 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-gray-400">Loading posts...</p>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((post) => (
                      <div 
                        key={post._id} 
                        className="bg-gray-900/50 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-800 hover:border-purple-700 transition-all group"
                      >
                        {/* Post Image/Media */}
                        {post.mediaUrl && (
                          <div className="relative aspect-square overflow-hidden">
                            {post.mediaType === 'image' ? (
                              <img 
                                src={post.mediaUrl} 
                                alt="Post" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : post.mediaType === 'video' ? (
                              <video 
                                src={post.mediaUrl}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                            
                            {/* Media Type Badge */}
                            <div className="absolute top-2 right-2 bg-black/60 rounded-lg p-1.5">
                              {post.mediaType === 'video' ? (
                                <Film className="w-4 h-4 text-white" />
                              ) : (
                                <Camera className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="p-3">
                          {/* Caption */}
                          {post.caption && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {post.caption}
                            </p>
                          )}
                          
                          {/* Post Stats */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Like Button */}
                              <button 
                                onClick={() => handleLike(post._id)}
                                disabled={likingPosts[post._id]}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors group"
                              >
                                {post.isLiked ? (
                                  <Heart className="w-4 h-4 lg:w-5 lg:h-5 fill-red-500 text-red-500" />
                                ) : (
                                  <Heart className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className={`text-xs lg:text-sm ${post.isLiked ? 'text-red-500' : ''}`}>
                                  {post.likesCount || 0}
                                </span>
                                {likingPosts[post._id] && (
                                  <Loader className="w-3 h-3 animate-spin ml-1" />
                                )}
                              </button>
                              
                              {/* Comment Button */}
                              <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                                <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                                <span className="text-xs lg:text-sm">{post.commentsCount || 0}</span>
                              </button>
                            </div>
                            
                            <span className="text-xs text-gray-500">
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/30 backdrop-blur-lg rounded-2xl border border-gray-800">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl text-gray-300 mb-2">No posts yet</h3>
                    <p className="text-gray-500 text-sm mb-6">This user hasn't created any posts</p>
                    <button 
                      onClick={() => fetchUserPosts(userId)}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
                    >
                      Check Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-white mb-4">
                  Media
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {posts.filter(post => post.mediaUrl).map((post) => (
                    <div 
                      key={post._id}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                    >
                      <img 
                        src={post.mediaUrl} 
                        alt="Media" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-white text-xs">
                          <span>{post.likesCount || 0} ❤️</span>
                          <span>{post.commentsCount || 0} 💬</span>
                        </div>
                      </div>
                      {post.mediaType === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded-lg p-1.5">
                          <Film className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GetUserProfile;