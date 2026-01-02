const mongoose = require("mongoose");
const User = require("../models/user.model");
const Post = require('../models/post.model');

// const getProfile = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const userProfile = await User.findById(id).select(
//       "_id firstName lastName followers following postCount profilePic views bio"
//     );

//     if (!userProfile) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json(userProfile);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to get user profile" });
//   }
// };


const getAllProfiles = async(req, res)=>{

    try {
        
        const users = await User.find().select("_id firstName lastName followers following postCount profilePic views bio");

        if(!users || users.length == 0){
            return res.status(404).send({message:"Users are not found"});
        }

        res.status(200).json(users);

    } catch (error) {
        res.status(500).send("Users are not found");
    }
    
}

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, bio, profilePic } = req.body;

    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(bio && { bio }),
          ...(profilePic && { profilePic }),
        },
      },
      { new: true }
    ).select("_id firstName lastName profilePic bio");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

const followUser = async(req, res) =>{

  try {
    
    const userId = req.user.id;
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(404).json({message:"Invalid user id"});
    }

    if(userId === id){
      return res.status(404).send("You cannot follow yourself");
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(id);

    if(!user || !targetUser){
      res.status(404).send("User not found");
    }

    if (!user.following.includes(id)) {
      user.following.push(id);
      await user.save();
    }

    if (!targetUser.followers.includes(userId)) {
      targetUser.followers.push(userId);
      await targetUser.save();
    }

    // user.following.push(id);
    // targetUser.followers.push(userId);

    // await user.save();
    // await targetUser.save();

    res.status(200).json({
      message:"User followed succussfully",
      followingCount : user.following.length,
      followersCount : targetUser.followers.length,
    })


  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to follow to user");
  }

}


const unfollowUser = async (req, res) => {
  try {
    const userId = req.user?.id; // Defensive: req.user must exist
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (userId === id) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    // Atomic updates using $pull
    const [updatedUser, updatedTarget] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { $pull: { following: id } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        id,
        { $pull: { followers: userId } },
        { new: true }
      ),
    ]);

    if (!updatedUser || !updatedTarget) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User unfollowed successfully",
      followingCount: updatedUser.following.length,
      followersCount: updatedTarget.followers.length,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
};


const getUserPosts = async(req, res) =>{
  try {
    
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).send("Invalid user id");
    }

    const posts = await Post.find({user:id})
    .sort({createdAt: -1})
    .populate("user", "name avatar");

    
    if(!posts || posts.length === 0){
      return res.status(400).send("User has no posts");
    }

    res.status(200).json({posts});

  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get user posts");
  }
}

const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get user with basic info
    const user = await User.findById(id)
      .select("_id firstName lastName email profilePic bio followers following postCount views createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if it's own profile
    const isOwnProfile = currentUserId && currentUserId.toString() === id.toString();
    
    // Check if current user follows this profile
    const isFollowing = currentUserId
      ? user.followers.some(followerId => 
          followerId.toString() === currentUserId.toString()
        )
      : false;

    // Get posts count (you can also get limited posts here if needed)
    const postCount = await Post.countDocuments({ user: id });

    res.status(200).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        views: user.views || 0,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        postCount: postCount,
        isFollowing,
        createdAt: user.createdAt
      },
      isOwnProfile
    });

  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const getFollowers = async(req, res)=>{
  try {
    
    const {id} = req.params;

    const user = await User.findById(id).populate("followers", "name avatatr");

    if(!user){
      return res.status(404).send("User not found");
    }

    res.status(200).json({followers: user.followers});

  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get followers");
  }
}

const getFollowing = async(req,res)=>{

  try {
    
    const {id} = req.params;

    const user = await User.findById(id).populate("following", "name avatar");

    if(!user){
      return res.status(404).send("User not found");
    }

    res.status(200).json({following: user.following});

  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get following");
  }

}

const getSuggestedUsers = async(req, res)=>{

  try {

    const userId = req.user?.id;

    if(!userId){
      return res.status(404).send("Unauthorized");
    }

    const currUser = await User.findById(userId);

    const suggestedUsers = await User.find({
      _id : { $nin: [userId, ...currUser.following]},
    })
    .limit(10)
    .select("name avatar");
    

    res.status(200).json({suggestedUsers});

  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get suggested userd");
  }
}

const getUserProfile = async(req, res)=>{

  try{
    const {id} = req.params;
    const currentUserId = req.user?.id;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(404).send("Invalid user profile id");
    }

    const user = await User.findById(id)
      .select("_id firstName lastName followers following postCount profilePic views bio createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's posts
    const posts = await Post.find({ user: id })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName profilePic");

    const isFollowing = currentUserId
      ? user.followers.some(followerId => 
          followerId.toString() === currentUserId.toString()
        )
      : false;

    // Calculate counts
    const followersCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;
    const postCount = posts.length;

    res.status(200).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        views: user.views || 0,
        followersCount,
        followingCount,
        postCount,
        isFollowing,
        createdAt: user.createdAt
      },
      posts
    });
    
  }catch(error){
    res.status(500).send("Failed to fetch user profile");
  }
}



module.exports = { getProfile, getAllProfiles, updateProfile, followUser, 
  unfollowUser, getUserPosts, getFollowers, getFollowing, getSuggestedUsers, getUserProfile
};
