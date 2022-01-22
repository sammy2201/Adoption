//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var validator = require("email-validator");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const animate = 'animate.css';
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

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


mongoose.connect("mongodb://localhost:27017/adoptDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now());
  }
});

var upload = multer({
  storage: storage
});

//////////////////Schema//////////////

const userSchema = new mongoose.Schema({
  username: String,
  name: {
    type: String,
    unique: true,
  },
  password: String,
  typeOfUser: String,
  googleId:String
});

const orphanageSchema = new mongoose.Schema({
  name: String,
  adoptid: String,
  address: String,
  phonenum: Number,
  state: String,
  city: String,
  pincode: Number,
  mail: String,
  adminname: String,
  img: {
    data: Buffer,
    contentType: String
  },
  stars: {
    num: [Array],
    name: [Array],
    final: {
      type: Number,
      default: 0
    },
  },
  description: String,
});

const reviewSchema = new mongoose.Schema({
  name: String,
  content: String,
  orphanagename: String,
});

const requestSchema = new mongoose.Schema({
  childname: String,
  requestername: String,
  orphanagename: String,
  individualname: String
});

const requestreplySchema = new mongoose.Schema({
  childname: String,
  requestername: String,
  orphanagename: String,
  individualname: String
});

const childSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  hobies: String,
  intrestedin: String,
  studies: String,
  guardian: String,
  orphanage: String,
  dob: String,
  img: {
    data: Buffer,
    contentType: String
  },
});

const individualSchema = new mongoose.Schema({
  status: String,
  name: {
    type: String,
    unique: true,
  },
  age: Number,
  phonenum: Number,
  mail: String,
  address: String,
  state: String,
  city: String,
  pincode: Number,
  gender: String,
  hobies: String,
  hobies2: String,
  momname: String,
  dadname: String,
  occupation: String,
  Achievements: String,
  intrestedin: String,
  studies: String,
  dob: String,
  img: {
    data: Buffer,
    contentType: String
  },

});

const postSchema = new mongoose.Schema({
  img: {
    data: Buffer,
    contentType: String
  },
  discription: String,
  username: String,
  likes: {
    num: {
      type: Number,
      default: 0
    },
    name: [Array]
  },
});

const commentSchema = new mongoose.Schema({
  name: String,
  content: String,
  nameofposter: String,
  idofposter: String
});


const chatSchema = new mongoose.Schema({
  groupname: String,
  sendername: String,
  recevername: String,
  time: String,
  chat: String,
});

//////////////////////////////////////////////////////////////////
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//////////////////////////model//////////////////////////////////
const User = new mongoose.model("User", userSchema);
const Orphanage = new mongoose.model("Orphanage", orphanageSchema);
const Child = new mongoose.model("Child", childSchema);
const Individual = new mongoose.model("Individual", individualSchema);
const Post = new mongoose.model("Post", postSchema);
const Request = new mongoose.model("Request", requestSchema);
const Review = new mongoose.model("Review", reviewSchema);
const Comment = new mongoose.model("Comment", commentSchema);
const Requestreply = new mongoose.model("Requestreply", requestreplySchema);
const Chat = new mongoose.model("Chat", chatSchema);
/////////////////////////passport//////////////////////////////

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/adoption",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo', ////maehshallOfSOundgadicomment
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({googleId: profile.id , name:profile.displayName ,typeOfUser:"user"}, function(err, user) {
      return cb(err, user);
    });
  }
));
////////////////////////////replaceaLl fun/////////////////////
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, match, replacement) {
  return str.replace(new RegExp(escapeRegExp(match), 'g'), () => replacement);
}

///////////////////////////get////////////////////////////////////


Request.find({}, function(err, founditems) {
  if (founditems.length === 0) {
    const someconstant = new Request({
      childname: " & & &",
      requestername: "& & & ",
      orphanagename: "& & & ",
    });
    someconstant.save();
  }
});


app.get("/", function(req, res) {
  if (req.isAuthenticated()) {
    User.find(function(err, founduser) {
      Post.find(function(err, founditems) {
        Comment.find(function(err, foundcomments) {
          res.render("homelogin", {
            founduser: founduser,
            items: founditems,
            user: req.user.name,
            comments: foundcomments
          });
        });
      });
    });
  } else {
    Post.find(function(err, founditems) {
      res.render("home", {
        items: founditems,
      });
    });
  }
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));

  app.get("/auth/google/adoption",
    passport.authenticate('google', {
      failureRedirect: '/login'
    }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });

app.get("/myacceptedlist", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "user") {
      Requestreply.find(function(err, founditems) {
        res.render("myacceptedlist", {
          items: founditems,
          user: req.user.name,
        });
      });
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/login");
  }
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

app.get("/recentlostlogin", function(req, res) {
  res.render("recentlostlogin");
});

app.get("/recentlostregister", function(req, res) {
  res.render("recentlostregister");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


app.get("/recentlost", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "recentlost") {
      Chat.find(function(err, foundchat) {
        Individual.find(function(err, founditems) {
          Request.find(function(err, foundrequests) {
            res.render("recentlost", {
              items: founditems,
              check: req.user.name,
              requestsgot: foundrequests,
              chat: foundchat
            });
          });
        });
      });
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/recentlostlogin");
  }
});

app.get("/recentlostdetails", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "recentlost") {
      res.render("recentlostdetails")
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/recentlostlogin");
  }
});

app.get("/orphanagedetails", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "admin") {
      res.render("orphanagedetails")
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/adminlogin");
  }
});


app.get("/studentdetails", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "admin") {
      Chat.find(function(err, foundchat) {
        Orphanage.find(function(err, founditems) {
          Child.find(function(err, foundchilditems) {
            Request.find(function(err, foundrequests) {
              User.find(function(err, founduser) {
                res.render("studentdetails", {
                  items: founditems,
                  check: req.user.name,
                  childitems: foundchilditems,
                  requestsgot: foundrequests,
                  chat: foundchat,
                  founduser: founduser
                });
              });
            });
          });
        });
      });
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/adminlogin");
  }
});
app.get("/adoption", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "user") {
      User.find(function(err, founduser) {
        Orphanage.find(function(err, founditems) {
          Individual.find(function(err, foundindividual) {
            res.render("adopt", {
              items: founditems,
              users: founduser,
              indi: foundindividual
            });
          });
        });
      });
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/posts", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("posts")
  } else {
    res.redirect("/login");
  }
});

app.get("/individual/:name", function(req, res) {
  const pathname = req._parsedOriginalUrl.pathname.slice(12)
  const pathnamwithspace = replaceAll(pathname, '%20', ' ')
  if (req.isAuthenticated()) {
    if (req.user.typeOfUser == "user") {
      Individual.find(function(err, founditems) {
        res.render("recentlostforuser", {
          items: founditems,
          check: pathnamwithspace,
          user: req.user.name,
        });
      });
    } else {
      console.log("problem");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/chat/with/:name", function(req, res) {
  const pathname = req._parsedOriginalUrl.pathname.slice(11)
  const pathnamwithspace = replaceAll(pathname, '%20', ' ')
  const check = pathnamwithspace.split('+').pop();
  const thisuser = pathnamwithspace.substr(0, pathnamwithspace.indexOf('+'));
  if (req.isAuthenticated()) {
    Chat.find(function(err, founditems) {
      Orphanage.find(function(err, foundorphan) {
        res.render("chat", {
          newChat: founditems,
          check: check,
          user: thisuser,
          groupname: pathnamwithspace,
          foundorphan: foundorphan,
          actualuser: req.user.name
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});


app.get("/:costumName", function(req, res) {
  if (req.isAuthenticated()) {
    const pathname = req._parsedOriginalUrl.pathname.slice(1)
    const pathnamwithspace = replaceAll(pathname, '%20', ' ')
    if (req.user.typeOfUser == "user") {
      Orphanage.find(function(err, founditems) {
        Child.find(function(err, foundchilditems) {
          Review.find(function(err, foundreviews) {
            Request.find(function(err, foundrequests) {
              res.render("childrendetailsforuser", {
                items: founditems,
                check: pathnamwithspace,
                childitems: foundchilditems,
                user: req.user.name,
                recivedreviews: foundreviews,
                requestsgot: foundrequests,
              });
            });
          });
        });
      });
    } else {
      console.log("problemforcust");
    }
  } else {
    res.redirect("/login");
  }
});



////////////////////////post////////////////////////////////
app.post("/", function(req, res) {
  const id = req.body.button.substr(0, req.body.button.indexOf('+'));
  const nameofliker = req.body.button.split('+').pop();
  Post.findById(id, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      const liked = docs.likes.num + 1;
      Post.findByIdAndUpdate(id, {
        $set: {
          'likes.num': liked
        },
        $push: {
          "likes.name": nameofliker
        }
      }, function(err, docs) {
        if (err) {
          console.log(err)
        } else {}
      });
    }
  });

  res.redirect("/");
});


app.post("/comments", function(req, res) {
  const nameofcommenter = req.body.button.substring(0, req.body.button.indexOf('*'));
  const id = req.body.button.substring(req.body.button.indexOf('*') + 1, req.body.button.indexOf('+'));
  const poster = req.body.button.split('+').pop();
  const someconstant = new Comment({
    name: nameofcommenter,
    content: req.body.content,
    nameofposter: poster,
    idofposter: id
  });
  someconstant.save();
  res.redirect("/");
});


app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    typeOfUser: "user"
  });
  req.login(user, function(err) {
    if (err) {
      res.render("error", {
        error: "unauthorized"
      });
    } else {
      passport.authenticate("local")(req, res, function() {
        User.find({
          typeOfUser: "user",
          username: req.body.username
        }, function(err, docs) {
          if (err) {
            console.log(err);
          } else {
            if (docs != "") {
              res.redirect("/");
            } else {
              console.log("you are a admin")
            }
          }
        });
      });
    }
  });
});

app.post("/recentlostlogin", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    typeOfUser: "recentlost"
  });
  req.login(user, function(err) {
    if (err) {
      res.render("error", {
        error: "unauthorized"
      });
    } else {
      passport.authenticate("local")(req, res, function() {
        User.find({
          typeOfUser: "recentlost",
          username: req.body.username
        }, function(err, docs) {
          if (err) {
            console.log(err);
          } else {
            if (docs != "") {
              res.redirect("/recentlost");
            } else {
              console.log("you are a admin")
            }
          }
        });
      });
    }
  });
});

app.post("/adminlogin", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    typeOfUser: "admin"
  });
  req.login(user, function(err) {
    if (err) {
      res.render("error", {
        error: "unauthorized"
      });
    } else {
      passport.authenticate("local")(req, res, function() {
        User.find({
          typeOfUser: "admin",
          username: req.body.username
        }, function(err, docs) {
          if (err) {
            console.log(err);
          } else {
            if (docs != "") {
              res.redirect("/studentdetails");
            } else {
              console.log("you are a user")
            }
          }
        });
      });
    }
  });
});

app.post("/register", function(req, res) {
  const nameOfUser = req.body.name;
  User.register({
    username: req.body.username,
    name: nameOfUser,
    typeOfUser: "user"
  }, req.body.password, function(err, user) {
    if (err) {
      res.render("error", {
        error: "username or mail already exist please try with other credentials"
      });
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});

app.post("/recentlostregister", function(req, res) {
  const nameOfUser = req.body.name;
  User.register({
    username: req.body.username,
    name: nameOfUser,
    typeOfUser: "recentlost"
  }, req.body.password, function(err, user) {
    if (err) {
      res.render("error", {
        error: "username or mail already exist please try with other credentials"
      });
      res.redirect("/recentlostdetails");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/recentlostdetails");
      });
    }
  });
});

app.post("/adminregister", function(req, res) {
  const nameOfUser = req.body.name;

  User.register({
    username: req.body.username,
    name: nameOfUser,
    typeOfUser: "admin"
  }, req.body.password, function(err, user) {
    if (err) {
      res.render("error", {
        error: "username or mail already exist please try with other credentials"
      });
      res.redirect("/orphanagedetails");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/orphanagedetails");
      });
    }
  });

});


app.post("/orphanagedetails", upload.single('image'), function(req, res) {
  const someconstant = new Orphanage({
    name: req.body.Orphanagename,
    adoptid: req.body.AdoptID,
    address: req.body.Address,
    phonenum: req.body.phonenumber,
    state: req.body.state,
    city: req.body.city,
    pincode: req.body.pincode,
    description: req.body.description,
    mail: req.body.email,
    adminname: req.user.name,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  });
  someconstant.save();
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdatename", upload.single('image'), function(req, res) {
  const id = req.body.button.substring(0, req.body.button.indexOf('+'));
  const oldname = req.body.button.split('+').pop();
  Orphanage.findByIdAndUpdate(id, {
    name: req.body.Orphanagename,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  Child.updateMany({
    orphanage: oldname
  }, {
    "$set": {
      orphanage: req.body.Orphanagename
    }
  }, function(err, book) {
    if (err) {
      console.log(err);
    } else {}
  });

  Request.updateMany({
    orphanagename: oldname
  }, {
    "$set": {
      orphanagename: req.body.Orphanagename
    }
  }, function(err, book) {
    if (err) {
      console.log(err);
    } else {}
  });
  Review.updateMany({
    orphanagename: oldname
  }, {
    "$set": {
      orphanagename: req.body.Orphanagename
    }
  }, function(err, book) {
    if (err) {
      console.log(err);
    } else {}
  });
  Requestreply.updateMany({
    orphanagename: oldname
  }, {
    "$set": {
      orphanagename: req.body.Orphanagename
    }
  }, function(err, book) {
    if (err) {
      console.log(err);
    } else {}
  });
  Chat.updateMany({
    sendername: oldname
  }, {
    "$set": {
      sendername: req.body.Orphanagename
    }
  }, function(err, book) {
    if (err) {
      console.log(err);
    } else {}
  });
  Chat.updateMany({
    recevername: oldname
  }, {
    "$set": {
      recevername: req.body.Orphanagename
    }
  }, function(err, book) {
    if (err) {
      console.log(err);
    } else {}
  });
  Chat.find({}, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      for (i = 0; i < docs.length; i++) {
        var firstname = docs[i].groupname.substring(0, docs[i].groupname.indexOf('+'));
        var oldname2 = docs[i].groupname.split('+').pop();
        if (oldname2 === oldname) {
          Chat.updateMany({
            groupname: firstname + "+" + oldname
          }, {
            "$set": {
              groupname: firstname + "+" + req.body.Orphanagename
            }
          }, function(err, result) {
            if (err) {
              console.log(err)
            } else {}
          });
        }
      }
    }
  });

  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdatephonenumber", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    phonenum: req.body.phonenumber,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdateemail", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    mail: req.body.email,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdateAddress", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    address: req.body.Address,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdatecity", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    city: req.body.city,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdatestate", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    state: req.body.state,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdatepincode", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    pincode: req.body.pincode,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/orphanagedetailsupdatepinimage", upload.single('image'), function(req, res) {
  id = req.body.button;
  Orphanage.findByIdAndUpdate(id, {
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/studentdetails");
});

app.post("/recentlostdetails", upload.single('image'), function(req, res) {
  const someconstant = new Individual({
    name: req.body.name,
    age: req.body.Age,
    address: req.body.Address,
    phonenum: req.body.phonenumber,
    state: req.body.state,
    city: req.body.city,
    pincode: req.body.pincode,
    mail: req.body.email,
    gender: req.body.gender,
    hobies: req.body.hobies,
    intrestedin: req.body.intrestedin,
    studies: req.body.studies,
    hobies2: req.body.hobies2,
    momname: req.body.mothername,
    dadname: req.body.fathername,
    occupation: req.body.occupation,
    Achievements: req.body.Achievements,
    dob: req.body.dob,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  });
  someconstant.save();
  res.redirect("/recentlost");
});

app.post("/updaterecentlostimage", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailsupdateage", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    age: req.body.Age,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailsphone", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    phonenum: req.body.phonenumber,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailsmail", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    mail: req.body.email,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailaddress", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    address: req.body.Address,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailscity", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    city: req.body.city,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailstate", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    state: req.body.state,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailspincode", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    pincode: req.body.pincode,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailstudies", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    studies: req.body.studies,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});
app.post("/recentlostdetailoccupation", upload.single('image'), function(req, res) {
  id = req.body.button;
  Individual.findByIdAndUpdate(id, {
    occupation: req.body.occupation,
  }, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log("hi gug");
    }
  });
  res.redirect("/recentlost");
});

app.post("/studentdetails", upload.single('image'), function(req, res) {
  const someconstant = new Child({
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    hobies: req.body.hobies,
    intrestedin: req.body.intrestedin,
    studies: req.body.studies,
    guardian: req.body.guardian,
    orphanage: req.body.button,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  });
  someconstant.save();
  res.redirect("/studentdetails");
});


app.post("/studentdetailsstars", function(req, res) {
  const id = req.body.button.substr(0, req.body.button.indexOf('+'));
  const nameofliker = req.body.button.substring(req.body.button.indexOf('+') + 1, req.body.button.indexOf('*'));
  const route = req.body.button.substring(req.body.button.indexOf('*') + 1, req.body.button.indexOf('&'));
  const value = req.body.button.split('&').pop();
  Orphanage.findById(id, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      const numberofuserliked = docs.stars.name.length + 1;
      var count = 0;
      docs.stars.num.forEach(function(item) {
        count = parseInt(item) + count
      });
      Orphanage.findByIdAndUpdate(id, {
        $set: {
          'stars.final': (count + parseInt(value)) / numberofuserliked
        },
        $push: {
          'stars.num': value,
          "stars.name": nameofliker
        }
      }, function(err, docs) {
        if (err) {
          console.log(err)
        } else {}
      });
    }
  });
  res.redirect("/" + route);
});

app.post("/review", function(req, res) {
  const nameofreviewwriter = req.body.button.substring(0, req.body.button.indexOf('*'));
  const route = req.body.button.split('*').pop();

  const someconstant = new Review({
    name: nameofreviewwriter,
    content: req.body.content,
    orphanagename: route,
  });
  someconstant.save();
  res.redirect("/" + route);
});

app.post("/acceptorreject", function(req, res) {
  const id = req.body.button.substr(0, req.body.button.indexOf('@'));
  const orphanagename = req.body.button.substring(req.body.button.indexOf('@') + 1, req.body.button.indexOf('&'));
  const requestername = req.body.button.substring(req.body.button.indexOf('&') + 1, req.body.button.indexOf('+'));
  const childname = req.body.button.substring(req.body.button.indexOf('+') + 1, req.body.button.indexOf('*'));
  const status = req.body.button.split('*').pop();

  if (status == "notok") {
    Request.findByIdAndDelete(id, function(err, docs) {
      if (err) {
        console.log(err)
      } else {}
    });
  }
  if (status == "ok") {
    const someconstant = new Requestreply({
      childname: childname,
      requestername: requestername,
      orphanagename: orphanagename,
    });
    someconstant.save();
    Request.findByIdAndDelete(id, function(err, docs) {
      if (err) {
        console.log(err)
      } else {}
    });
  }
  res.redirect("/studentdetails");
});



app.post("/acceptorrejectindividual", function(req, res) {
  const id = req.body.button.substr(0, req.body.button.indexOf('@'));
  const orphanagename = req.body.button.substring(req.body.button.indexOf('@') + 1, req.body.button.indexOf('&'));
  const requestername = req.body.button.substring(req.body.button.indexOf('&') + 1, req.body.button.indexOf('+'));
  const childname = req.body.button.substring(req.body.button.indexOf('+') + 1, req.body.button.indexOf('*'));
  const status = req.body.button.split('*').pop();

  if (status == "notok") {
    Request.findByIdAndDelete(id, function(err, docs) {
      if (err) {
        console.log(err)
      } else {}
    });
  }
  if (status == "ok") {
    const someconstant = new Requestreply({
      childname: childname,
      requestername: requestername,
      orphanagename: orphanagename,
    });
    someconstant.save();
    Request.findByIdAndDelete(id, function(err, docs) {
      if (err) {
        console.log(err)
      } else {}
    });
  }
  res.redirect("/recentlost");
});


app.post("/deletereview", function(req, res) {
  const id = req.body.button.substring(0, req.body.button.indexOf('&'));
  const route = req.body.button.split('&').pop();
  Review.findByIdAndDelete(id, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/" + route);
});

app.post("/deletepost", function(req, res) {
  const id = req.body.button
  Post.findByIdAndDelete(id, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/");
});

app.post("/deletechild", function(req, res) {
  const id = req.body.button
  Child.findByIdAndDelete(id, function(err, docs) {
    if (err) {
      console.log(err)
    } else {
      console.log(docs);
    }
  });
  res.redirect("/studentdetails");
});

app.post("/deletecomment", function(req, res) {
  const id = req.body.button;
  Comment.findByIdAndDelete(id, function(err, docs) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/");
});


app.post("/updatestatus", function(req, res) {
  Individual.updateOne({
    _id: req.body.button
  }, {
    status: req.body.adoptornot
  }, function(err, result) {
    if (err) {
      console.log(err)
    } else {}
  });
  res.redirect("/recentlost");
});

app.post("/request", function(req, res) {
  const nameofrequester = req.body.button.substring(0, req.body.button.indexOf('*'));
  const nameofchild = req.body.button.substring(req.body.button.indexOf('*') + 1, req.body.button.indexOf('&'));
  const route = req.body.button.split('&').pop();
  const someconstant = new Request({
    childname: nameofchild,
    requestername: nameofrequester,
    orphanagename: route,
  });
  someconstant.save();
  res.redirect("/" + route);
});

app.post("/requestindividual", function(req, res) {
  const nameofrequester = req.body.button.substring(0, req.body.button.indexOf('*'));
  const route = req.body.button.split('*').pop();
  const someconstant = new Request({
    childname: route,
    requestername: nameofrequester,
    individualname: "individual"
  });
  someconstant.save();
  res.redirect("/individual/" + route);
});



app.post("/posts", upload.single('image'), function(req, res) {
  const someconstant = new Post({
    username: req.user.name,
    discription: req.body.discription,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  });
  someconstant.save();
  res.redirect("/");
});


app.post("/chat", upload.single('image'), function(req, res) {
  const chat = req.body.chat;
  const groupname = req.body.button;
  const nameOfUser = req.user.name;
  const date_ob = new Date();
  const hours = date_ob.getHours();
  const minutes = date_ob.getMinutes();
  const currentTime = hours + ":" + minutes;
  const recevername = groupname.split('+').pop();
  const recevername2 = groupname.substring(0, groupname.indexOf('+'));

  Orphanage.find({
    adminname: nameOfUser
  }, function(err, founduser) {
    if (err) {
      console.log(err);
    } else {
      if (founduser[0] != undefined) {
        const someconstant = new Chat({
          groupname: groupname,
          sendername: founduser[0].name,
          recevername: recevername2,
          time: currentTime,
          chat: chat,
        });
        someconstant.save();
      } else {
        if (nameOfUser === recevername) {
          const someconstant = new Chat({
            groupname: groupname,
            sendername: nameOfUser,
            recevername: recevername2,
            time: currentTime,
            chat: chat,
          });
          someconstant.save();
        } else {
          const someconstant = new Chat({
            groupname: groupname,
            sendername: nameOfUser,
            recevername: recevername,
            time: currentTime,
            chat: chat,
          });
          someconstant.save();
        }
      }
    }
  });



  res.redirect("/chat/with/" + groupname);
});

/////////////////////////////listen///////////////////////////////

app.listen(3000, function() {
  console.log("in port 3000");
});
