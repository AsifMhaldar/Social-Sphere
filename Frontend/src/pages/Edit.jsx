import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';

function Edit() {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    profilePic: ''
  });
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'posts'
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setError("User ID not found in URL");
      setLoading(false);
      return;
    }

    fetchProfileAndPosts();
  }, [userId]);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      const [profileResponse, postsResponse] = await Promise.all([
        axiosClient.get(`/profile/getProfile/${userId}`),
        axiosClient.get(`/posts/user/${userId}/posts`)
      ]);

      setProfile(profileResponse.data);
      
      // Set edit form with current profile data
      if (profileResponse.data.user) {
        setEditForm({
          firstName: profileResponse.data.user.firstName || '',
          lastName: profileResponse.data.user.lastName || '',
          bio: profileResponse.data.user.bio || '',
          profilePic: profileResponse.data.user.profilePic || ''
        });
      }

      // Set user posts
      if (Array.isArray(postsResponse.data)) {
        setUserPosts(postsResponse.data);
      } else if (postsResponse.data && Array.isArray(postsResponse.data.posts)) {
        setUserPosts(postsResponse.data.posts);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit form input change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!userId || editLoading) return;
    
    setEditLoading(true);
    try {
      const response = await axiosClient.put(`/profile/updateProfile/${userId}`, editForm);
      
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          firstName: response.data.firstName || editForm.firstName,
          lastName: response.data.lastName || editForm.lastName,
          bio: response.data.bio || editForm.bio,
          profilePic: response.data.profilePic || editForm.profilePic
        }
      }));
      
      alert("Profile updated successfully!");
      
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [postId]: true }));
    
    try {
      await axiosClient.delete(`/posts/${postId}`);
      
      // Remove post from local state
      setUserPosts(prev => prev.filter(post => post._id !== postId));
      
      // Update post count in profile
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          postCount: Math.max(0, (prev.user.postCount || 0) - 1)
        }
      }));
      
      alert("Post deleted successfully!");
      
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error.response?.data?.message || "Failed to delete post");
    } finally {
      setDeleteLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchProfileAndPosts();
  };

  // Go back to profile
  const goToProfile = () => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
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
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Profile & Posts</h1>
            <p className="text-gray-400">Manage your profile and posts</p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={goToProfile}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
            >
              View Profile
            </button>
            <button
              onClick={refreshData}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-medium ${activeTab === 'profile' 
              ? 'text-white border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-gray-300'}`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-3 font-medium ${activeTab === 'posts' 
              ? 'text-white border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-gray-300'}`}
          >
            Manage Posts ({userPosts.length})
          </button>
        </div>

        {/* Profile Edit Section */}
        {activeTab === 'profile' && (
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-900/30">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    rows="4"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm mb-2">Profile Picture URL</label>
                  <input
                    type="text"
                    name="profilePic"
                    value={editForm.profilePic}
                    onChange={handleEditChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="https://example.com/your-image.jpg"
                  />
                  <div className="mt-3 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700">
                      <img 
                        src={editForm.profilePic || "https://via.placeholder.com/150"} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-gray-400 text-sm">
                      Enter a URL for your profile picture. Current preview shown.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={goToProfile}
                  className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {editLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Management Section */}
        {activeTab === 'posts' && (
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-900/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Your Posts</h2>
              <div className="text-gray-400">
                {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-6xl mb-4">📝</div>
                <h3 className="text-xl text-gray-300 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-6">You haven't created any posts</p>
                <button 
                  onClick={() => navigate('/create-post')}
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPosts.map((post) => (
                  <div 
                    key={post._id} 
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-700 transition-colors"
                  >
                    {/* Post Media */}
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
                    
                    {/* Post Info */}
                    <div className="mb-4">
                      {post.caption && (
                        <p className="text-gray-300 text-sm mb-2">
                          {post.caption.length > 80 
                            ? `${post.caption.substring(0, 80)}...` 
                            : post.caption}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {post.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentsCount || 0}
                          </span>
                        </div>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/edit-post/${post._id}`)}
                        className="flex-1 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        disabled={deleteLoading[post._id]}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm disabled:opacity-50"
                      >
                        {deleteLoading[post._id] ? (
                          <span className="flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </span>
                        ) : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Stats Summary */}
            {userPosts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Posts Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{userPosts.length}</div>
                    <div className="text-gray-400 text-sm">Total Posts</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {userPosts.reduce((total, post) => total + (post.likesCount || 0), 0)}
                    </div>
                    <div className="text-gray-400 text-sm">Total Likes</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {userPosts.reduce((total, post) => total + (post.commentsCount || 0), 0)}
                    </div>
                    <div className="text-gray-400 text-sm">Total Comments</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {userPosts.length > 0 
                        ? new Date(Math.max(...userPosts.map(p => new Date(p.createdAt)))) 
                            .toLocaleDateString()
                        : 'N/A'}
                    </div>
                    <div className="text-gray-400 text-sm">Last Post</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Edit;