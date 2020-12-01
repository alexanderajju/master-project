var express = require("express");
var router = express.Router();
const { comparearray } = require("../helper/destination_helper");
const {
  hotelLogin,
  addRoom,
  hoteldestination,
  getRoom,
  editFeatures,
} = require("../helper/hotel_helpers");

const verifyuser = (req, res, next) => {
  if (req.session.hotel) {
    next();
  } else {
    res.redirect("/hotel/login");
  }
};

/* GET home page. */
router.get("/", verifyuser, async (req, res, next) => {
  let hotel = req.session.user;
  let rooms = await getRoom(req.session.hotel);
  console.log(rooms);
  res.render("hotels/Home", { hotel, rooms });
});
router.get("/login", (req, res) => {
  if (req.session.hotel) {
    res.redirect("/");
  } else {
    res.render("hotels/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = null;
  }
});
router.post("/login", (req, res) => {
  hotelLogin(req.body).then((response) => {
    if (response.status) {
      req.session.hotel = response.user;
      req.session.user = response.user;
      req.session.loggedIn = true;
      res.redirect("/hotel");
    } else {
      req.session.userLoginErr = "Invalid Username or password";
      res.redirect("/hotel/login");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.hotel = null;
  res.redirect("/");
});
router.get("/editfeatures", verifyuser, async (req, res) => {
  await comparearray(req.session.hotel._id).then((response) => {
    console.log(response);
    res.render("hotels/Hotelfeatures", {
      features: response.hotel,
      notfeature: response.val,
    });
  });
});

router.get("/addroom", async (req, res) => {
  let destination = await hoteldestination(req.session.hotel);

  res.render("hotels/addroom", { destination });
});
router.post("/editfeatures", (req, res) => {
  console.log(req.body);
  editFeatures(req.session.hotel._id, req.body.features).then((response) => {
    res.redirect("/hotel");
  });
});
router.post("/addroom", (req, res) => {
  console.log(req.body, req.session.hotel._id);
  addRoom(req.body, req.session.hotel).then((id) => {
    let image = req.files.image;
    image.mv("./public/HOTEL/" + id + ".jpg", (err, done) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/hotel");
      }
    });
  });
});

module.exports = router;
