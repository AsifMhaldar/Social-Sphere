const express = require('express');

const authRouter = express.Router();
const {register, login, logout, adminRegister, getAllUsers} = require("../controllers/user.controller");
const userMiddleware = require('../middleware/user.middleware');
const adminMiddleware = require('../middleware/admin.middleware');


// register, login,logout, getProfile this all are controllers
authRouter.post("/register", register)
authRouter.post("/login", login)
authRouter.post("/logout", userMiddleware, logout)
authRouter.post("/admin/register", adminMiddleware,adminRegister);
authRouter.get("/all", userMiddleware, getAllUsers); 
// authRouter.delete("/deleteProfile", userMiddleware, deleteProfile);
authRouter.get('/check', userMiddleware, (req, res)=>{

    const reply = {
        firstName:req.result.firstName,
        email:req.result.email,
        _id:req.result._id,
        role:req.result.role,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    })
})
// authRouter.post("/getProfile", getProfile)



module.exports = authRouter;
