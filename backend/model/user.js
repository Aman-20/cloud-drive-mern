const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    pass:{
        type:String,
        required:true,
    },
    isVerified:{
        type:Boolean,
        default:false,
    },
    otpLimit:{
        count:{
            type:Number,
            default:0,
        },
        windowStart:{
            type:Date,
            default:null,
        }
    },
    resetLimit:{
        count:{
            type:Number,
            default:0,
        },
        windowStart:{
            type:Date,
            default:null,
        }
    },
    loginLimit:{
        count:{
            type:Number,
            default:0,
        },
        windowStart:{
            type:Date,
            default:null,
        }
    },
    passwordChangedAt: { 
        type: Date, 
        default: null 
    },
});


const User = mongoose.model("User", userSchema);

module.exports = {User};