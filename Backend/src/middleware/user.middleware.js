
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const redisClient = require('../config/redis')

const userMiddleware = async(req, res, next)=>{

    try{

        const {token} = req.cookies;
        if(!token){
            throw new Error("Token is not present...");
        }

        const payload = jwt.verify(token, process.env.JWT_KEY);

        const {_id} = payload;
        if(!_id){
            throw new Error("Invalid Token...");
        }

        const result = await User.findById(_id);
        if(!result){
            throw new Error("User doesn't Exist...");
        }

        const isBlocked = await redisClient.exists(`token:${token}`);

        if(isBlocked){
            throw new Error("Invalid token");
        }

        // Keep backward compatibility: some routes use `req.result`, others expect `req.user`
        req.result = result;
        req.user = result;

        next();
        

    }catch(err){
        res.status(401).send("Error: "+err);
    }

}

module.exports = userMiddleware;