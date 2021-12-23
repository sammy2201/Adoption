//jshint esversion:6
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
  typeOfUser: String
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
  name: String,
  age: Number,
  phonenum: Number,
  mail: String,
  address: String,
  state: String,
  city: String,
  pincode: Number,
  gender: String,
  hobies: String,
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
    num:{
      type:Number,
      default:0
    },
    name: [Array]

  }

});

//////////////////////////////////////////////////////////////////
userSchema.plugin(passportLocalMongoose);

//////////////////////////model//////////////////////////////////
const User = new mongoose.model("User", userSchema);
const Orphanage = new mongoose.model("Orphanage", orphanageSchema);
const Child = new mongoose.model("Child", childSchema);
const Individual = new mongoose.model("Individual", individualSchema);
const Post = new mongoose.model("Post", postSchema);

/////////////////////////passport//////////////////////////////

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
////////////////////////////replaceaLl fun/////////////////////
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, match, replacement) {
  return str.replace(new RegExp(escapeRegExp(match), 'g'), () => replacement);
}

///////////////////////////get////////////////////////////////////

app.get("/", function(req, res) {
  if (req.isAuthenticated()) {
    User.find(function(err, founduser) {
      Post.find(function(err, founditems) {
        res.render("homelogin", {
          items: founditems,
          user: req.user.name
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
      Individual.find(function(err, founditems) {
        res.render("recentlost", {
          items: founditems,
          check: req.user.name,
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
      Orphanage.find(function(err, founditems) {
        Child.find(function(err, foundchilditems) {
          res.render("studentdetails", {
            items: founditems,
            check: req.user.name,
            childitems: foundchilditems,
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
      Orphanage.find(function(err, founditems) {
        res.render("adopt", {
          items: founditems,
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


app.get("/:costumName", function(req, res) {
  if (req.isAuthenticated()) {
    const pathname = req._parsedOriginalUrl.pathname.slice(1)
    const pathnamwithspace = replaceAll(pathname, '%20', ' ')
    if (req.user.typeOfUser == "user") {
      Orphanage.find(function(err, founditems) {
        Child.find(function(err, foundchilditems) {
          res.render("childrendetailsforuser", {
            items: founditems,
            check: pathnamwithspace,
            childitems: foundchilditems,
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



////////////////////////post////////////////////////////////

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
    dob: req.body.dob,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  });
  someconstant.save();
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

app.post("/", function(req, res) {
  console.log(req.body)
  const id= req.body.button.substr(0, req.body.button.indexOf('+'));
  const nameofliker=req.body.button.split('+').pop();
  Post.findById(id, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      const liked = docs.likes.num + 1;
      Post.findByIdAndUpdate(id, {$set: {'likes.num': liked}, $push: { "likes.name": nameofliker } }, function(err, docs) {
        if (err) {
          console.log(err)
        } else {}
      });
    }
  });

  res.redirect("/");
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

/////////////////////////////listen///////////////////////////////

app.listen(3000, function() {
  console.log("in port 3000");
});
