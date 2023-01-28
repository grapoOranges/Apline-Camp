var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
           if(err || !foundCampground){
               req.flash("error", "Campground not found");
               res.redirect("back");
           }  else {
               // does user own the campground?
               // one is mongoose object and second one is a string
            if(foundCampground.author.id.equals(req.user._id) || (req.user && req.user.isAdmin)) {
                next();
            } else {
                req.flash("error", "Permission Denied!");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function (req, res, next) {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
               req.flash("error", "Comment not found!");
               res.redirect("back");
           }  else {  
               // does user own the comment?
               // one is mongoose object and second one is a string
            if(foundComment.author.id.equals(req.user._id) || (req.user && req.user.isAdmin)) {
                next();
            } else {
                req.flash("error", "Permission Denied!");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        // key is error and value is please login...
        req.flash('error', 'Please Login First!');
        // the flash is seen on next page and it has to be placed before it redirects
        res.redirect("/login"); 
}

module.exports = middlewareObj;