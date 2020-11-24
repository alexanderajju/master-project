var express = require("express");
const { getDestination } = require("../helper/destination_helper");
const { sortingHotel } = require("../helper/hotel_helpers");
const { doSignUp, doLogin } = require("../helper/user_helpers");
var router = express.Router();

/* GET users listing. */
router.get("/", async (req, res, next) => {
  let user = req.session.user;
  await getDestination().then((destination) => {
    res.render("user/home", { user, destination });
  });
});
router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = null;
  }
});
router.post("/login", (req, res) => {
  doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.loggedIn = true;
      res.redirect("/");
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
  res.render("hotels/rooms", { hotels });
});
router.post("/search", async (req, res) => {
  console.log(req.body.Destination);
  let destinations = await getDestination();
  let hotels = await sortingHotel(req.body.Destination);
  res.render("hotels/rooms", { destinations, hotels });
});
module.exports = router;
