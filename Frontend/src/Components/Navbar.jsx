// components/Navbar.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../authSlice';
import { useNavigate, NavLink } from 'react-router-dom';
import SocialSphere from '../assets/socialsphere.png';

function Navbar() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const goToHome = () => {
    navigate('/');
  };

  const goToProfile = () => {
    if (user?._id) {
      navigate(`/profile/${user._id}`);
    }
  };

  return (
    <div className="flex items-center justify-between bg-white shadow-md rounded-2xl p-4 mb-6">
      {/* Left side - Logo and Home link */}
      <div className="flex items-center gap-4">
        <button 
          onClick={goToHome}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src={SocialSphere}
            alt="SocialSphere logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
          <span className="hidden md:inline font-medium text-gray-800">Home</span>
        </button>
      </div>
      
      {/* Right side - User info and Logout */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            {/* Profile link */}
            <button 
              onClick={goToProfile}
              className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
            >
              {user.profilePic ? (
                <img 
                  src={user.profilePic} 
                  alt={`${user.firstName} avatar`} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-sm text-gray-700 hidden md:inline">
                <strong>{user.firstName}</strong>
              </span>
            </button>
            
            {/* Logout button */}
            <button 
              onClick={handleLogout} 
              className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden md:inline">Logout</span>
            </button>
          </>
        ) : (
          <NavLink to="/login" className="text-sm text-blue-600 hover:text-blue-800">
            Login
          </NavLink>
        )}
      </div>
    </div>
  );
}

export default Navbar;