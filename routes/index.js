let  express    = require('express'),
     router     = express.Router(),
     passport   = require('passport'),
     User       = require('../models/user'),
     async      = require('async'),
     nodemailer = require('nodemailer'),
     crypto     = require('crypto'),
     Campground = require('../models/campground');
     
// root route
router.get("/", function(req, res){
    res.render("landing");
});

//=================
// AUTH ROUTES
//=================

// show register form
router.get("/register", (req, res) => {
    res.render("register", {page: 'register'});
})

// handle sign up logic
router.post("/register", function(req, res) {
    var newUser = new User(
        {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            avatar: req.body.avatar,
            email: req.body.email,
            aboutMe: req.body.aboutMe
        });
    //eval(require('locus'));
    var admin = process.env.ADMINCODE;
    if(req.body.adminCode === admin) {
        newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to Alpine Camp " + user.username);
            res.redirect("/campgrounds");
        })
    })
});

// show login form 
router.get("/login", (req, res) => {
    res.render("login", {page: 'login'});
})

//handling login logic
// router.post("/login", passport.authenticate("local", 
//     {
//         successRedirect: "/campgrounds",
//         failureRedirect: "/login", 
//         failureFlash: true
//     }), (req, res) => {
// });

// or for displaying correct incorrect messages
router.post("/login", passport.authenticate("local",
    {
        failureRedirect: "/loginfailed",
        successRedirect: "/campgrounds"
    }), function(req, res) {
});

router.get("/loginfailed", (req, res) => {
    if (!req.user) {
        req.flash("error", "Please try again either username or password is incorrect!");
        res.redirect("/login");
    }
})

// logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged Out!");
    res.redirect("/campgrounds");
});

// forgot password
router.get('/forgot', function(req, res) {
    res.render('forgot');
})

// series of functions that are executed asychronously
router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
            //console.log(user);
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: '17571@nith.ac.in',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: '17571@nith.ac.in',
          subject: 'Node.js Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });

// RESET ROUTE
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });
  
  router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: '17571@nith.ac.in',
            pass:  process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: '17571@nith.ac.in',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n' + 'From AlpineCamp'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
        // this is flashed before redirecting to campgrounds
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/campgrounds');
    });
  });
  
  // USER PROFILE
  router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
      if(err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
        if(err) {
          req.flash("error", "Something went wrong.");
          return res.redirect("/");
        }
        console.log(foundUser.aboutMe);
        res.render("users/show", {user: foundUser, campgrounds: campgrounds});
      })
    });
  });

module.exports = router;