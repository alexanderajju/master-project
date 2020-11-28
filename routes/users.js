var express = require("express");
const { getDestination } = require("../helper/destination_helper");
const { sortingHotel } = require("../helper/hotel_helpers");
const { doSignUp, doLogin, getRoom } = require("../helper/user_helpers");

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
    res.render("user/home", { user, destination });
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
  req.session.user = null;
  res.redirect("/login");
});
router.get("/destination", async (req, res) => {
  let place = req.query.place;
  let id = req.query.id;
  let hotels = await sortingHotel(place, id);
  console.log(hotels);
  res.render("user/hotels", { hotels });
});
router.post("/search", verifyuser, async (req, res) => {
  console.log(req.body.Destination);
  let destinations = await getDestination();
  let hotels = await sortingHotel(req.body.Destination);
  res.render("user/hotels", { destinations, hotels });
});
router.get("/viewrooms", async (req, res) => {
  // let rooms = "No rooms currently";
  let rooms = await getRoom(req.query.id, req.query.hotel);
  res.render("user/viewrooms", { rooms });
});
module.exports = router;
