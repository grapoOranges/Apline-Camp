var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    flash          = require('connect-flash'),
    User           = require("./models/user"),
    seedDB         = require("./seeds");
    require('dotenv').config();
// requring routes
var commentRoutes     = require('./routes/comments'),
    campgroundRoutes  = require('./routes/campgrounds'),
    indexRoutes       = require('./routes/index');

// mongoose setup
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
//mongoose.connect("mongodb://localhost/alpine_camp_6");
var url = process.env.DATABASEURL || "mongodb://localhost/alpine_camp_6";
mongoose.connect(url);
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
//seedDB();
// moment variable is available in all files
app.locals.moment = require('moment');
//PASSPORT CONFIGURATION
app.use(require('express-session') ({
    secret: "you can do anything",
    resave: false, 
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// This function will be called on every route and currentUser will be available in every route
app.use(function(req, res, next) {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
    next();
});

// we will append in front of the routes with common prefixes
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);

app.listen(process.env.PORT || 8070, function(){
   console.log("The AlpineCamp Server Has Started!");
});