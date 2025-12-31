import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ArrowLeft,
  Eye,
  FileText,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock data - in real app, you would fetch from API
  const mockPosts = [
    { id: 1, title: 'Getting Started with React', content: 'React is a JavaScript library for building user interfaces...', category: 'Tutorial', author: 'John Doe', date: '2024-01-15', views: 1234 },
    { id: 2, title: 'Advanced TypeScript Patterns', content: 'TypeScript brings static typing to JavaScript...', category: 'Advanced', author: 'Jane Smith', date: '2024-01-20', views: 567 },
    { id: 3, title: 'Mastering Tailwind CSS', content: 'Tailwind CSS is a utility-first CSS framework...', category: 'Design', author: 'Mike Johnson', date: '2024-01-25', views: 890 },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundPost = mockPosts.find(p => p.id === parseInt(id));
      if (foundPost) {
        setPost(foundPost);
      } else {
        setError('Post not found');
      }
      setLoading(false);
    }, 800);
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPost(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, you would send PUT request to your API
      console.log('Saving post:', post);
      
      setSuccess('Post updated successfully!');
      setTimeout(() => {
        setSuccess(null);
        navigate('/posts'); // Redirect to posts list
      }, 2000);
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, you would send DELETE request to your API
      console.log('Deleting post:', id);
      
      setSuccess('Post deleted successfully!');
      setTimeout(() => {
        navigate('/posts'); // Redirect to posts list
      }, 1500);
    } catch (err) {
      setError('Failed to delete post. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                to="/posts"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Posts
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Edit Post</h1>
              <p className="text-gray-600">Make changes to your post below</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <Edit3 className="w-4 h-4" />
                <span>Editing Mode</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Views</div>
                  <div className="font-bold text-lg">{post?.views.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-bold text-lg">{post?.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Author</div>
                  <div className="font-bold text-lg">{post?.author}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-bold text-lg">{post?.category}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSave}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={post?.title || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="Enter post title"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={post?.category || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Design">Design</option>
                    <option value="News">News</option>
                    <option value="Update">Update</option>
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Editor</span>
                    </div>
                    <textarea
                      name="content"
                      value={post?.content || ''}
                      onChange={handleInputChange}
                      rows={12}
                      className="w-full px-4 py-3 focus:outline-none resize-none"
                      placeholder="Write your post content here..."
                      required
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Supports Markdown formatting
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Post
                  </button>

                  <Link
                    to="/posts"
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview
          </h3>
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-gray-800">{post?.title}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {post?.category}
              </span>
              <span>By {post?.author}</span>
              <span>•</span>
              <span>{post?.date}</span>
            </div>
            <div className="prose max-w-none border-t border-gray-100 pt-4">
              <p className="text-gray-700 whitespace-pre-line">{post?.content}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-scaleIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Delete Post?
              </h3>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{post?.title}"? This action cannot be undone.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Yes, Delete
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                All post data, including comments and views, will be permanently removed.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Edit;