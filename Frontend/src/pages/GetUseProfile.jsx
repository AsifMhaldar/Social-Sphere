import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';

function GetUserProfile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [likingPosts, setLikingPosts] = useState({});
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

  // Fetch user's posts using the correct route
  const fetchUserPosts = async (id) => {
    setPostsLoading(true);
    try {
      // Use the correct route: /posts/user/:id/posts
      const response = await axiosClient.get(`/posts/user/${id}/posts`);
      
      // Handle response
      let postsData = [];
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && Array.isArray(response.data.posts)) {
        postsData = response.data.posts;
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      // Fallback to old endpoint if new one fails
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

  // Like/Unlike a post
  const handleLike = async (postId) => {
    if (likingPosts[postId]) return;
    
    setLikingPosts(prev => ({ ...prev, [postId]: true }));
    
    try {
      // Optimistically update UI
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

      // Call like API
      await axiosClient.put(`/posts/${postId}/like`);
      
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
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

  // Follow the other user
  const handleFollow = async () => {
    if (!userId || followLoading) return;
    
    setFollowLoading(true);
    try {
      await axiosClient.post(`/profile/follow/${userId}`);
      
      // Update UI immediately
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

  // Unfollow the other user
  const handleUnfollow = async () => {
    if (!userId || followLoading) return;
    
    setFollowLoading(true);
    try {
      await axiosClient.post(`/profile/unfollow/${userId}`);
      
      // Update UI immediately
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

  // Refresh posts
  const refreshPosts = () => {
    if (userId) {
      fetchUserPosts(userId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
          <p className="text-gray-400 mt-2">User ID: {userId || "Not provided"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      {profile ? (
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-900/30 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img 
                  src={profile.user?.profilePic || "https://via.placeholder.com/150"} 
                  alt={`${profile.user?.firstName}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-purple-600 object-cover"
                />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profile.user?.firstName} {profile.user?.lastName}
                    </h1>
                  </div>
                  
                  {/* Follow/Unfollow Button */}
                  {!profile.isOwnProfile && (
                    profile.user?.isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        disabled={followLoading}
                        className="mt-4 md:mt-0 px-6 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 disabled:opacity-50"
                      >
                        {followLoading ? 'Processing...' : 'Following'}
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className="mt-4 md:mt-0 px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                      >
                        {followLoading ? 'Processing...' : 'Follow'}
                      </button>
                    )
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex justify-center md:justify-start gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profile.user?.postCount || posts.length}</div>
                    <div className="text-gray-400 text-sm">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profile.user?.followersCount || 0}</div>
                    <div className="text-gray-400 text-sm">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profile.user?.followingCount || 0}</div>
                    <div className="text-gray-400 text-sm">Following</div>
                  </div>
                </div>
                
                {/* Bio */}
                {profile.user?.bio && (
                  <p className="text-gray-300 mb-4">{profile.user.bio}</p>
                )}
                
                {/* Follow Status */}
                {profile.user?.isFollowing && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-400">You follow this user</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Posts ({posts.length})
              </h2>
              <button 
                onClick={refreshPosts}
                disabled={postsLoading}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
              >
                {postsLoading ? 'Refreshing...' : 'Refresh Posts'}
              </button>
            </div>
            
            {postsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading posts...</p>
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <div 
                    key={post._id} 
                    className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-800 hover:border-purple-700 transition-colors"
                  >
                    {/* Post Image/Media */}
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
                    
                    {/* Caption */}
                    <div className="mb-3">
                      {post.caption && (
                        <p className="text-gray-400 text-sm">
                          {post.caption.length > 100 
                            ? `${post.caption.substring(0, 100)}...` 
                            : post.caption}
                        </p>
                      )}
                    </div>
                    
                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        {/* Like Button */}
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
                        
                        {/* Comment Button */}
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
                <div className="text-gray-500 text-6xl mb-4">📝</div>
                <h3 className="text-xl text-gray-300 mb-2">No posts yet</h3>
                <p className="text-gray-500">This user hasn't created any posts</p>
                <button 
                  onClick={refreshPosts}
                  className="mt-4 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Check Again
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-6xl mb-4">😕</div>
          <h3 className="text-xl text-gray-300 mb-2">No profile data</h3>
          <p className="text-gray-500">Unable to load profile information</p>
        </div>
      )}
    </div>
  );
}

export default GetUserProfile;