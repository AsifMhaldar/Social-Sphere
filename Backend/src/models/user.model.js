const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type : String,
        required : true,
        minLength : 3,
        maxLength : 20
    },
    lastName:{
        type : String,
        minLength : 3,
        maxLength : 20
    },
    email:{
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        immutable : true
    },
    age:{
        type : Number,
        min : 5,
        max : 80,
    },
    role:{
        type : String,
        enum :['user', 'admin'],
        default : 'user',
    },
    followers:{
        type: Array,
        default: []
    },
    following:{
        type: Array,
        default: []
    },
    postCount:{
        type: Number,
        default: 0
    },
    password:{
        type: String,
        required: true,
    },
    profilePic:{
        type: String,
        default: ""
    },
    bio:{
        type: String,
        maxLength: 500,
        default: ""
    },
    views:{
        type: Number,
        default: 0
    }
}, { timestamps:true })


const User = mongoose.model("user", userSchema);

module.exports = User;

