//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var validator = require("email-validator");

const app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'Our secret',
  resave: false,
  saveUninitialized: false,
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//////////////////Schema//////////////

const userSchema = new mongoose.Schema({
  email: String,
  name: {
    type: String,
    unique: true,
  },
  password: String,
});

const adminSchema = new mongoose.Schema({
  email: String,
  name: {
    type: String,
    unique: true,
  },
  password: String,
  orphanage:String,
});

//////////////////////////////////////////////////////////////////
userSchema.plugin(passportLocalMongoose);
adminSchema.plugin(passportLocalMongoose);
//////////////////////////model//////////////////////////////////
const User = new mongoose.model("User", userSchema);
const Admin = new mongoose.model("Admin", adminSchema);
/////////////////////////passport//////////////////////////////
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(Admin.createStrategy());

passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());


///////////////////////////get////////////////////////////////////

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/adminlogin", function(req, res) {
  res.render("adminlogin");
});

app.get("/adminregister", function(req, res) {
  res.render("adminregister");
});

////////////////////////post////////////////////////////////
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      res.render("error",{
        error:"unauthorized"
      });
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});

app.post("/adminlogin", function(req, res) {
  const admin = new Admin({
    username: req.body.username,
    password: req.body.password
  });
  req.login(admin, function(err) {
    if (err) {
      res.render("error",{
        error:"unauthorized"
      });
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});

app.post("/register", function(req, res) {
  const nameOfUser = req.body.name;
if(validator.validate(req.body.username)===true){
  User.register({
    username: req.body.username,
    name: nameOfUser
  }, req.body.password, function(err, user) {
    if (err) {
      res.render("error",{
        error:"username or mail already exist please try with other credentials"
      });
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
}else{
  res.render("error",{
    error:"verify your mail"
  });
}
});

app.post("/adminregister", function(req, res) {
  const nameOfUser = req.body.name;

  Admin.register({
    username: req.body.username,
    name: nameOfUser,
    orphanage:req.body.orphanage
  }, req.body.password, function(err, admin) {
    if (err) {
      res.render("error",{
        error:"username or mail already exist please try with other credentials"
      });
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });

});

/////////////////////////////listen///////////////////////////////

app.listen(3000, function() {
  console.log("in port 3000");
});
