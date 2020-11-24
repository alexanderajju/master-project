var express = require("express");
const { addDestination } = require("../helper/destination_helper");
const { doAdminLogIn, getusers } = require("../helper/user_helpers");
const { getDestination } = require("../helper/destination_helper");
const {
  addHotel,
  addRoom,
  hotelsignup,
  viewHotel,
} = require("../helper/hotel_helpers");

var router = express.Router();

const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

/* GET home page. */
router.get("/", async (req, res, next) => {
  let admin = req.session.admin;
  let userCount = await getusers();
  console.log(userCount);
  viewHotel().then((response) => {
    let hotelcount = Object.keys(response).length;

    res.render("admin/adminHome", { admin: true, hotelcount, userCount });
  });
});
router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/");
  } else {
    res.render("admin/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = null;
  }
});
router.post("/login", (req, res) => {
  doAdminLogIn(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.username;
      req.session.user = response.username;
      req.session.admin.loggedIn = true;
      res.redirect("/admin");
    } else {
      req.session.userLoginErr = "Invalid admin or password";
      res.redirect("/admin/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.admin = null;
  res.redirect("/");
});

router.get("/Adddestination", (req, res) => {
  res.render("admin/addDestination", { admin: true });
});
router.post("/Adddestination", (req, res) => {
  console.log(req.body);
  addDestination(req.body).then((id) => {
    let image = req.files.image;
    image.mv("./public/Destination/" + id + ".jpg", (err, done) => {
      if (err) {
        console.log(err);
      } else {
        res.render("admin/Adddestination", { admin: true });
      }
    });
  });
});
router.get("/destinations", async (req, res) => {
  await getDestination().then((destination) => {
    console.log(destination);
    res.render("admin/Destinations", { destination, admin: true });
  });
});
router.get("/destination", (req, res) => {
  let place = req.query.place;
  let id = req.query.id;
  console.log(id);
  res.render("admin/viewhotels", { admin: true, place, id });
});
router.get("/addhotel", async (req, res) => {
  await getDestination().then((destination) => {
    console.log("destinations>>>>>>>>>>>>>>>>>>>>>>>>>>", destination);
    res.render("admin/addHotel", { admin: true, destination });
  });
});
router.post("/addhotel", (req, res) => {
  hotelsignup(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      req.session.user = response;
      req.session.loggedIn = true;
      let image = req.files.image;
      image.mv("./public/Hotels/" + response._id + ".jpg", (err, done) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/hotel");
        }
      });
    }
  });
});
router.get("/addRoom", (req, res) => {
  let roomCount = 4;
  res.render("admin/addRoom", { roomCount });
});
router.post("/addRoom", (req, res) => {
  addRoom(req.body).then((id) => {
    let image = req.files.image;
    image.mv("./public/Rooms/" + id + ".jpg", (err, done) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  });
});
router.get("/hotels", (req, res) => {
  viewHotel().then((hotel) => {
    console.log(hotel);
    res.render("admin/viewhotels", { hotel });
  });
});
module.exports = router;
