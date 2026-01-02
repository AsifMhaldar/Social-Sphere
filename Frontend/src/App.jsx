import { Routes, Route, Navigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './authSlice';
import { useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Community from './pages/Community';
import Trending from './pages/Trending';
import Profile from './pages/Profile';
import Edit from './pages/Edit';
import GetUseProfile from './pages/GetUseProfile';


function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // Check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Register />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />

      <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
      <Route path='/edit' element={isAuthenticated ? <Edit/> : <Navigate to='/edit'/>} />
      <Route path="/explore" element={isAuthenticated ? <Explore /> : <Navigate to="/login" />} />
      <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
      <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/login" />} />
      <Route path="/community" element={isAuthenticated ? <Community /> : <Navigate to="/login" />} />
      <Route path="/trending" element={isAuthenticated ? <Trending /> : <Navigate to="/login" />} />
      <Route path="/profile/:userId" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/getUserProfile/:userId" element={isAuthenticated ? <GetUseProfile /> : <Navigate to="/login" />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
