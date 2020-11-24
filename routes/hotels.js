var express = require("express");
var router = express.Router();
const { getDestination } = require("../helper/destination_helper");
const { hotelLogin, sortingHotel } = require("../helper/hotel_helpers");

/* GET home page. */
router.get("/", async (req, res, next) => {
  let hotel = req.session.user;
  res.render("hotels/Home", { hotel });
  await getDestination().then((destination) => {
    console.log("destinations>>>>>>>>>>>>>>>>>>>>>>>>>>", destination);
  });
});
router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("hotels/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = null;
  }
});
router.post("/login", (req, res) => {
  hotelLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.hotel = response.user;
      req.session.loggedIn = true;
      res.redirect("/hotel");
    } else {
      req.session.userLoginErr = "Invalid Username or password";
      res.redirect("/hotel/login");
    }
  });
});

router.post("/adddestination", (req, res) => {
  console.log(req.body);
  addHotel(req.body, req.session.user).then((id) => {
    let image = req.files.image;
    image.mv("./public/Hotels/" + id + ".jpg", (err, done) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/hotel");
      }
    });
  });
});
router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

module.exports = router;
