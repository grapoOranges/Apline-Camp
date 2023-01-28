let express     = require('express');
// This is done in order to parse _id and merge params of comment and campground
let router      = express.Router({mergeParams: true});
let Campground  = require('../models/campground');
let Comment     = require('../models/comment');
let middleware  = require('../middleware/index.js');

//comments new
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find campground by id
    Campground.findById(req.params.id, function(err, campground){
        if (err || !campground) {
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});

// comments create
router.post("/", middleware.isLoggedIn,function(req, res){
   //lookup campground using ID
   Campground.findById(req.params.id, function(err, campground){
       if (err || !campground) {
            //console.error(err);
           req.flash("error", "Something went wrong!");
           res.redirect("/campgrounds");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if (err || !comment) {
               req.flash("error", "Comment not found!");
               res.redirect("back");
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               // save the comment
               comment.save();
               campground.comments.push(comment);
               campground.save();
               req.flash("success", "Successfully added comment!");
               res.redirect('/campgrounds/' + campground._id);
           }
        });
      }
   });
}); 

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err || !foundCampground) {
            req.flash("error", "No campground found!");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err) {
                res.redirect("back");
            } else {
                // here req.params.id has that campground id
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
            }
        })
    });
})

//COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        if (err) {
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        } else {
            // campground id is defined in app.js 
            req.flash("success", "Successfully updated comment!");
            res.redirect("/campgrounds/" + req.params.id); 
        }
    });
});

// COMMENTS DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    //findByIdAndRemove
     Comment.findByIdAndRemove(req.params.comment_id, (err) => {
         if (err) {
             res.redirect("back");
         } else {
             req.flash("success", "Comment deleted successfully!");
             res.redirect("/campgrounds/" + req.params.id);
         }
     })
});
// middleware

module.exports = router;