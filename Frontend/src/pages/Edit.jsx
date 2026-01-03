import React, { useEffect, useState, useRef } from 'react';
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
  
  // File upload states
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
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
        // Set preview URL
        setPreviewUrl(profileResponse.data.user.profilePic || '');
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

  // Handle file selection when user clicks on profile picture
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleProfilePicClick = () => {
    fileInputRef.current.click();
  };

  // Handle edit form input change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update profile with file upload
  const handleUpdateProfile = async (e) => {
  e.preventDefault();
  if (!userId || editLoading) return;
  
  setEditLoading(true);
  
  try {
    const formData = new FormData();
    
    // Add text fields
    formData.append('firstName', editForm.firstName);
    formData.append('lastName', editForm.lastName);
    formData.append('bio', editForm.bio);
    
    // Add file if selected, otherwise add the URL
    if (selectedFile) {
      formData.append('profilePic', selectedFile);
    } else if (editForm.profilePic) {
      formData.append('profilePic', editForm.profilePic);
    }

    console.log('Sending FormData with file:', !!selectedFile);

    const response = await axiosClient.put(`/profile/updateProfile/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Update local state
    setProfile(prev => ({
      ...prev,
      user: {
        ...prev.user,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        bio: response.data.bio,
        profilePic: response.data.profilePic
      }
    }));
    
    setPreviewUrl(response.data.profilePic);
    setSelectedFile(null);
    
    alert("Profile updated successfully!");
    
  } catch (error) {
    console.error("Update error:", error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile & Posts</h1>
            <p className="text-gray-600">Manage your profile and posts</p>
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-medium ${activeTab === 'profile' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-3 font-medium ${activeTab === 'posts' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Manage Posts ({userPosts.length})
          </button>
        </div>

        {/* Profile Edit Section */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Profile Picture Upload Section */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Profile Picture</label>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-4">
                    {/* Clickable Profile Picture */}
                    <div className="relative group cursor-pointer" onClick={handleProfilePicClick}>
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 group-hover:border-blue-500 transition-all">
                        <img 
                          src={previewUrl || editForm.profilePic || "https://via.placeholder.com/150"} 
                          alt="Profile preview"
                          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        />
                      </div>
                      {/* Camera icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Click on the profile picture to upload a new one</p>
                          <button
                            type="button"
                            onClick={handleProfilePicClick}
                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            {selectedFile ? 'Change Image' : 'Upload Image'}
                          </button>
                        </div>
                        
                        {selectedFile && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700 font-medium">
                              ✓ New image selected: {selectedFile.name}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Click "Save Changes" to upload and update your profile
                            </p>
                          </div>
                        )}
                        
                        {uploading && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-sm text-blue-700">Uploading image...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Or enter a URL:</p>
                    <input
                      type="text"
                      name="profilePic"
                      value={editForm.profilePic}
                      onChange={handleEditChange}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/your-image.jpg"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Supported formats: JPEG, PNG, GIF, WebP | Max size: 5MB
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    rows="4"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-gray-500 text-xs mt-1">Share something about yourself (max 500 characters)</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={goToProfile}
                  className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button

                  onClick={goToProfile}
                  type="submit"
                  disabled={editLoading || uploading}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </span>
                  ) : uploading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Uploading...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Management Section (unchanged from your original code) */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Your Posts</h2>
              <div className="text-gray-600">
                {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl text-gray-600 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-6">You haven't created any posts</p>
                <button 
                  onClick={() => navigate('/create-post')}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPosts.map((post) => (
                  <div 
                    key={post._id} 
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors"
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
                        <p className="text-gray-600 text-sm mb-2">
                          {post.caption.length > 80 
                            ? `${post.caption.substring(0, 80)}...` 
                            : post.caption}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
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
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/edit-post/${post._id}`)}
                        className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        disabled={deleteLoading[post._id]}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Edit;