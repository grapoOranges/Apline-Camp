let express     = require('express'),
    router      = express.Router(),
    Campground  = require('../models/campground'),
    middleware  = require('../middleware/index.js'),
    multer      = require('multer');
// we don't have to do /index.js it is special name and fetched automatically inside of a folder
//INDEX - show all campgrounds

// Setting up multer
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function (req, file, cb) {
    // accept image files only with following extensions
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }   
    cb(null, true);
};

var upload = multer({storage: storage, fileFilter: imageFilter});
// setting up cloudinary
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'ankit0107verma',
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

 
router.get("/", function(req, res){
    //eval(require("locus"));
    // Get all campgrounds from DB
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({$or: [{name: regex,}, {location: regex}, {"author.username":regex}]}, function(err, allCampgrounds){
            if (err) {
                console.log(err);
            } else {
                if (allCampgrounds.length === 0) {
                    req.flash("error", "Sorry no campgrounds match your query. Please try again!");
                    return res.redirect("/campgrounds");
                } 
               res.render("campgrounds/index",{campgrounds:allCampgrounds, currentUser: req.user, page: 'campgrounds'});
            }
         });
    } else {
        Campground.find({}, function(err, allCampgrounds){
           if (err) {
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:allCampgrounds, currentUser: req.user, page: 'campgrounds'});
           }
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), middleware.isLoggedIn, function(req, res){
//     cloudinary.uploader.upload(req.file.path, function(result) {
//         var name = req.body.name;
//         var image = result.secure_url;
//         var price = req.body.price;
//         var desc = req.body.description;  
//         console.log(desc);  
//         var author = {
//             id: req.user._id,
//             username: req.user.username
//         };
//         var newCampground = {
//             name: name, 
//             image: image, 
//             description: desc,
//             author: author,
//             price: price
//         };
        
//         // Create a new campground and save to DB
//         Campground.create(newCampground, function(err, newlyCreated){
//             if (err) {
//                 req.flash('error', err.message);
//                 return res.redirect('back');
//             } 
//                 //redirect back to campgrounds page
//                 console.log(newlyCreated);  
//                 res.redirect("/campgrounds/" + newlyCreated.id);
//         });
// });
cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
    if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
    }
   
    // add cloudinary url for the image to the campground object under image property
    req.body.campground.image = result.secure_url;
    // here req.body.price will have price from the form and saving inside campground object with key price
    req.body.campground.price = req.body.price;
    // add image's public_id to campground object
    req.body.campground.imageId = result.public_id;
    // add author to campground
    req.body.campground.author = {
      id: req.user._id,
      username: req.user.username
    }
    Campground.create(req.body.campground, function(err, newlyCreated) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/campgrounds/' + newlyCreated.id);
    });
  });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if (err || !foundCampground) {
            req.flash("error", "Campground not found!");
            res.redirect("back");
        } else {
            // console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if (err) {
            req.flash("error", "Campground not found!");
            res.redirect("/campgrounds");
        }
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE

router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            // using async functions try catch property
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.name;
            campground.description = req.body.description;
            campground.price = req.body.price;
            campground.save();
            req.flash("success","Campground Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
   Campground.findById(req.params.id, async function(err, campground) {
       if (err) {
           req.flash("error", err.message);
           return res.redirect("back");
       }
       try {
           await cloudinary.v2.uploader.destroy(campground.imageId);
           campground.remove();
           req.flash("success", "Campground deleted successfully!");
           res.redirect("/campgrounds");
       } catch(err) {
           req.flash("error", err.message);
           return res.redirect("back");
       }
   })
 });

// middleware
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;