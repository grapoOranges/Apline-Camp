var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    isAdmin: {type: Boolean, default: false},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    firstName: String,
    lastName: String,
    aboutMe: String,
    password: String, 
    avatar: String,
    email: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);