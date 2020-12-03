var express = require("express");
const {
  getDestination,
  comparearray,
} = require("../helper/destination_helper");
const { sortingHotel, compareroomarray } = require("../helper/hotel_helpers");
const { doSignUp, doLogin, getRoom } = require("../helper/user_helpers");
var fs = require("fs");
const { features } = require("process");

var router = express.Router();

const verifyuser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET users listing. */
router.get("/", async (req, res, next) => {
  let user = req.session.user;
  await getDestination().then((destination) => {
    if (user) {
      fs.readFile("./public/HOTEL/" + user._id + ".jpg", (err, done) => {
        console.log(user._id);
        if (err) {
          console.log(err, done);
          res.render("user/home", { user, destination, done });
        } else {
          console.log("image found", done);
          res.render("user/home", { user, destination, done });
        }
      });
    } else {
      res.render("user/home", { user, destination });
    }
  });
});
router.get("/profile", verifyuser, (req, res) => {
  if (req.session.user.customer) {
    let user = req.session.user;
    res.render("user/profile", { user });
  } else if (req.session.user.hotel) {
    res.redirect("/hotel");
  } else {
    res.redirect("/admin");
  }
});
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.back(req.session);
  } else if (req.session.hotel) {
    console.log(req.session.hotel);
    return res.back(req.session);
  } else if (req.session.admin) {
    return res.back(req.session);
  } else {
    res.render("user/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = null;
  }
});
router.post("/login", (req, res) => {
  doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.username;
      req.session.loggedIn = true;
      return res.back(req.session);
    } else {
      req.session.userLoginErr = "Invalid Username or password";
      res.redirect("/login");
    }
  });
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
router.post("/signup", (req, res) => {
  doSignUp(req.body).then((response) => {
    if (response.status) {
      req.session.user = response;
      user = req.session.user;
      console.log("user");
      console.log(user);
      req.session.loggedIn = true;
      res.render("user/home", { user });
    }
  });
});
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("connect.sid"); // clean up!
    res.redirect("/");
  } else {
    return res.json({ msg: "no user to log out!" });
  }
});
router.get("/destination", async (req, res) => {
  let user = req.session.user;
  let place = "";
  let id = "";
  let hotels = "";
  if (req.query.id) {
    place = req.query.place;
    id = req.query.id;
    hotels = await sortingHotel(place, id);

    if (user) {
      fs.readFile("./public/HOTEL/" + user._id + ".jpg", (err, done) => {
        console.log(user._id);
        if (err) {
          place = req.query.place;
          console.log(place);
          console.log("page called1");
          res.render("user/hotels", { user, hotels, done, place });
        } else {
          console.log("page called2");
          place = req.query.place;
          res.render("user/hotels", { user, hotels, done, place });
        }
      });
    } else {
      console.log("page called");
      place = req.query.place;
      console.log(place);
      res.render("user/hotels", { hotels, user, place });
    }
  }
});
router.post("/search", verifyuser, async (req, res) => {
  let destinations = await getDestination();
  let hotels = "";
  if (req.body.Destination) {
    hotels = await sortingHotel(req.body.Destination);
  }

  res.render("user/hotels", { destinations, hotels });
});
router.get("/viewrooms", async (req, res) => {
  let rooms = "";
  let user = req.session.user;
  if (req.query.id) {
    console.log("req>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.query.hotel);
    rooms = await getRoom(req.query.id, req.query.hotel);
    feature = await comparearray(req.query.id);
    if (user) {
      fs.readFile("./public/HOTEL/" + user._id + ".jpg", (err, done) => {
        if (err) {
          console.log(err, done);
          res.render("user/viewrooms", {
            rooms,
            feature: feature.hotel,
            user,
            done,
          });
        } else {
          res.render("user/viewrooms", {
            rooms,
            feature: feature.hotel,
            user,
            done,
          });
        }
      });
    } else {
      res.render("user/viewrooms", {
        rooms,
        feature: feature.hotel,
        user,
      });
    }
  } else {
    console.log(rooms);
    let user = req.session.user;
    res.render("user/viewrooms", { rooms, user });
  }
});
router.get("/favico.ico", (req, res) => {
  res.sendStatus(404);
});

router.get("/test", (req, res) => {
  compareroomarray();
});
module.exports = router;
