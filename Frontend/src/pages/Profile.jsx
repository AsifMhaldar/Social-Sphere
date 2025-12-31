import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useParams();

  useEffect(() => {
    // Check if userId exists before fetching
    if (!userId) {
      // console.log(userId)
      setError("User ID not found in URL");
      setLoading(false);
      return;
    }

    fetchProfile(userId);
  }, [userId]); // Add userId as dependency

  const fetchProfile = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // console.log("Fetching profile for user ID:", userId); // Debug log
      
      const response = await axiosClient.get(`/profile/getProfile/${userId}`);
      // console.log("Profile response:", response.data); // Debug log
      
      setProfile(response.data);
    } catch (error) {
      // console.error("Error fetching profile:", error);
      setError(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };
  

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  // Profile data display
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      {profile ? (
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-900/30 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <img 
                  src={profile.user?.profilePic || "https://via.placeholder.com/150"} 
                  alt={`${profile.user?.firstName}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-purple-600 object-cover"
                />
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {profile.user?.firstName} {profile.user?.lastName}
                </h1>
                <p className="text-gray-400 mb-4">{profile.user?.email}</p>
                
                {/* Stats */}
                <div className="flex justify-center md:justify-start gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profile.user?.postCount || 0}</div>
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
                {profile.user?.isFollowing !== undefined && (
                  <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                    profile.user.isFollowing 
                      ? 'bg-green-900/30 text-green-400 border border-green-800' 
                      : 'bg-purple-900/30 text-purple-400 border border-purple-800'
                  }`}>
                    {profile.user.isFollowing ? 'Following' : 'Not Following'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Posts Section */}
          {profile.posts && profile.posts.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Posts ({profile.posts.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.posts.map((post) => (
                  <div 
                    key={post._id} 
                    className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-800 hover:border-purple-700 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{post.title || 'Untitled Post'}</h3>
                    <p className="text-gray-400 text-sm mb-3">{post.content?.substring(0, 100)}...</p>
                    <div className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-6xl mb-4">📝</div>
              <h3 className="text-xl text-gray-300 mb-2">No posts yet</h3>
              <p className="text-gray-500">This user hasn't created any posts</p>
            </div>
          )}
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

export default Profile;