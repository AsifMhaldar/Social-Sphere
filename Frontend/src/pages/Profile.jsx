import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import Navbar from '../Components/Navbar'; // Import Navbar

function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likingPosts, setLikingPosts] = useState({});
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // Get user from Redux
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!userId) {
      setError("User ID not found in URL");
      setLoading(false);
      return;
    }

    Promise.all([
      fetchProfile(userId),
      fetchPosts(userId)
    ]).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  // Fetch user profile info
  const fetchProfile = async (id) => {
    try {
      const response = await axiosClient.get(`/profile/getProfile/${id}`);
      setProfile(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load profile");
    }
  };

  // Fetch user's posts
  const fetchPosts = async (id) => {
    setPostsLoading(true);
    try {
      const response = await axiosClient.get(`/profile/getUserPosts/${id}`);
      
      let postsData = [];
      if (response.data && Array.isArray(response.data.posts)) {
        postsData = response.data.posts;
      } else if (Array.isArray(response.data)) {
        postsData = response.data;
      }
      
      const transformedPosts = postsData.map(post => ({
        ...post,
        isLiked: post.isLiked || false,
        likesCount: post.likesCount || post.likes?.length || 0,
        commentsCount: post.commentsCount || post.comments?.length || 0,
      }));
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Like/Unlike post
  const handleLike = async (postId) => {
    if (likingPosts[postId]) return;
    
    setLikingPosts(prev => ({ ...prev, [postId]: true }));
    
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const wasLiked = post.isLiked;
            return {
              ...post,
              isLiked: !wasLiked,
              likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1
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
              likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1
            };
          }
          return post;
        })
      );
      alert(error.response?.data?.message || "Failed to toggle like");
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Navigate to edit page
  const handleEditProfile = () => {
    navigate(`/edit/${userId}`);
  };

  // Refresh posts
  const refreshPosts = () => {
    if (userId) {
      fetchPosts(userId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-gray-500 mt-2">User ID: {userId || "Not provided"}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Use Navbar component */}
        <Navbar />
        
        {profile ? (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <img 
                    src={profile.user?.profilePic || "https://via.placeholder.com/150"} 
                    alt={`${profile.user?.firstName}'s profile`}
                    className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover"
                  />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profile.user?.firstName} {profile.user?.lastName}
                      </h1>
                    </div>
                    
                    {/* Update Profile Button (only show if it's user's own profile) */}
                    {profile.isOwnProfile && (
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 md:mt-0 px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                    )}
                  </div>
                  
                  <div className="flex justify-center md:justify-start gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{profile.user?.postCount || posts.length}</div>
                      <div className="text-gray-500 text-sm">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{profile.user?.followersCount || 0}</div>
                      <div className="text-gray-500 text-sm">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{profile.user?.followingCount || 0}</div>
                      <div className="text-gray-500 text-sm">Following</div>
                    </div>
                  </div>
                  
                  {profile.user?.bio && (
                    <p className="text-gray-600 mb-4">{profile.user.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Posts ({posts.length})
                </h2>
                <button 
                  onClick={refreshPosts}
                  disabled={postsLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  {postsLoading ? 'Refreshing...' : 'Refresh Posts'}
                </button>
              </div>
              
              {postsLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post) => (
                    <div 
                      key={post._id} 
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors shadow-sm"
                    >
                      {post.mediaUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          {post.mediaType === 'image' ? (
                            <img 
                              src={post.mediaUrl} 
                              alt="Post" 
                              className="w-full h-48 object-cover"
                            />
                          ) : post.mediaType === 'video' ? (
                            <video 
                              src={post.mediaUrl}
                              className="w-full h-48 object-cover"
                              controls
                            />
                          ) : null}
                        </div>
                      )}
                      
                      <div className="mb-3">
                        {post.caption && (
                          <p className="text-gray-600 text-sm">
                            {post.caption.length > 100 
                              ? `${post.caption.substring(0, 100)}...` 
                              : post.caption}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLike(post._id)}
                            disabled={likingPosts[post._id]}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            title={post.isLiked ? 'Unlike' : 'Like'}
                          >
                            {post.isLiked ? (
                              <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            )}
                            <span className={post.isLiked ? 'text-red-500' : ''}>
                              {post.likesCount || 0}
                            </span>
                            {likingPosts[post._id] && (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-1"></div>
                            )}
                          </button>
                          
                          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.commentsCount || 0}</span>
                          </button>
                        </div>
                        <span className="text-gray-400">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-xl text-gray-600 mb-2">No posts yet</h3>
                  <p className="text-gray-500">This user hasn't created any posts</p>
                  <button 
                    onClick={refreshPosts}
                    className="mt-4 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Check Again
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h3 className="text-xl text-gray-600 mb-2">No profile data</h3>
            <p className="text-gray-500">Unable to load profile information</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;