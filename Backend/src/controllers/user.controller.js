const redisClient = require("../config/redis");
const User = require("../models/user.model");  // this is schema to imoprt in this file
const validate = require("../utils/validate");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


// Register feature
const register = async (req, res) => {
    try {
        validate(req.body);

        const {firstName, email, password} = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user';

        const user = await User.create(req.body);

        const token = jwt.sign(
            {_id: user._id, email: user.email, role: 'user'}, 
            process.env.JWT_KEY, 
            {expiresIn: 60*60}
        );
        
        const reply = {
            firstName: user.firstName,
            email: user.email,
            _id: user._id,
            role: user.role
        }

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        
        res.status(201).json({
            user: reply,
            message: "Registration Successfully"
        });

    } catch(err) {
        console.error('Registration error:', err);
        res.status(400).json({ message: err.message || "Registration failed" });
    }
}


//LogIn feature
const login = async(req, res) => {
    try {

        // console.log('📝 Login attempt:', req.body);
        const {email, password} = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({email});
        // console.log('👤 User found:', user ? 'Yes' : 'No');  // ✅ Add this  
        
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        // console.log('🔐 Password match:', match);  // ✅ Add this

        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const reply = {
            firstName: user.firstName,
            email: user.email,
            _id: user._id,
            role: user.role  // ✅ Include role
        }

        const token = jwt.sign(
            {_id: user._id, email: user.email, role: user.role}, 
            process.env.JWT_KEY, 
            {expiresIn: 60*60}
        );
        
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        
        res.status(200).json({  // ✅ 200 for login, not 201
            user: reply,
            message: "Login Successfully"
        });

    } catch(err) {
        // console.error('❌ Login error:', err.message);  // ✅ Add this
        res.status(500).json({ message: "Internal server error" });
    }
}

// LogOut Feature
const logout = async (req, res)=>{

    try{
        const {token} = req.cookies;

        const payload = jwt.decode(token);
        

        await redisClient.set(`token:${token}`, "Blocked");
        await redisClient.expireAt(`token:${token}`, payload.exp);


        res.cookie("token", null, {expires: new Date(Date.now())}); 
        res.send("Logged Out Successfully...");

        // token add into redis blocklist
        // after that clear the cookies
    }
    catch(err){
        res.status(503).send("Error: "+err);
    }   

}

const adminRegister = async(req, res)=>{

    try{

        // validate the data

        validate(req.body);  // this req.body is pass to validate function
        const {firstName, email, password} = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        // req.body.role = 'admin';

        const user = await User.create(req.body);

        const token = jwt.sign({_id:user._id, email:email, role:user.role}, process.env.JWT_KEY, {expiresIn: 60*60});
        res.cookie('token', token, {maxAge : 60*60*1000});
        res.status(201).send("User Registered Succefully...");

        // const ans = User.exists({email});    // check email is already exists or not

        
    }catch(err){
        res.status(400).send("Error: "+err);
    }

}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.result._id } }, // exclude logged in user
      "firstName email profilePic"
    );

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// const deleteProfile = async(req, res)=>{

//     try{
//         const userId = req.result._id;

//         await User.findByIdAndDelete(userId); // userSchema delete

//         // submission se bhi delete krdo
//         await Submission.deleteMany({userId});

//         res.status(200).send("Deleted Successfully..")

//     }catch(err){
//         res.status(500).send("Internal Server Error..");
//     }

// }


module.exports = {register, login, logout, adminRegister, getAllUsers};