const express = require('express');

const profileRouter = express.Router();
const userMiddleware = require('../middleware/user.middleware');
const {
    getProfile,
    getAllProfiles,
    updateProfile,
    followUser,
    unfollowUser,
    getUserPosts,
    getFollowers,
    getFollowing,
    getSuggestedUsers
} = require('../controllers/profile.controller');


profileRouter.get('/getProfile/:id',userMiddleware, getProfile);
profileRouter.get('/getAllProfiles', getAllProfiles);
profileRouter.put('/updateProfile/:id',userMiddleware, updateProfile);
profileRouter.post('/follow/:id',userMiddleware, followUser);
profileRouter.post('/unfollow/:id', userMiddleware, unfollowUser);
profileRouter.get('/getUserPosts/:id',userMiddleware, getUserPosts);
profileRouter.get('/followers/:id', userMiddleware, getFollowers);
profileRouter.get('/following/:id', userMiddleware, getFollowing);
profileRouter.get('/suggested', userMiddleware, getSuggestedUsers);


module.exports = profileRouter;

