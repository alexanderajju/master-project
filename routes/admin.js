var express = require("express");
const { addDestination } = require("../helper/destination_helper");
const {
  doAdminLogIn,
  getusers,
  deleteUser,
} = require("../helper/user_helpers");
const { getDestination } = require("../helper/destination_helper");
const {
  addHotel,
  addRoom,
  hotelsignup,
  viewHotel,
  deleteHotel,
  editHotel,
  getHotel,
} = require("../helper/hotel_helpers");
let fs = require("fs");
var nodemailer = require("nodemailer");

var router = express.Router();

const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

/* GET home page. */
router.get("/", verifyAdmin, async (req, res, next) => {
  let admin = req.session.admin;
  let userCount = await getusers();
  viewHotel().then((response) => {
    let hotelcount = Object.keys(response).length;

    res.render("admin/adminHome", {
      admin: true,
      hotelcount,
      userCount: Object.keys(userCount).length,
    });
  });
});
router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/");
  } else {
    res.render("login/adminlogin", { loginErr: req.session.userLoginErr });
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
  addDestination(req.body).then((id) => {
    let image = req.files.image;
    image.mv("./public/HOTEL/" + id + ".jpg", (err, done) => {
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
    res.render("admin/Destinations", { destination, admin: true });
  });
});
router.get("/destination", (req, res) => {
  let place = req.query.place;
  let id = req.query.id;
  res.render("admin/viewhotels", { admin: true, place, id });
});
router.get("/addhotel", async (req, res) => {
  await getDestination().then((destination) => {
    res.render("admin/addHotel", { admin: true, destination });
  });
});
router.post("/addhotel", (req, res) => {
  hotelsignup(req.body).then((response) => {
    if (response.id) {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "alexanderajju@gmail.com",
          pass: "krsbqimfqnpqknkz",
        },
      });
      console.log(response.password);
      var mailOptions = {
        from: "alexanderajju@gmail.com",
        to: response.email,
        subject: "Your account Created in Travelix",
        text:
          "Your Hotel Created successfully with username:- " +
          response.username +
          " and your password is: " +
          response.password,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      let image = req.files.image;
      if (req.files.image) {
        image.mv("./public/HOTEL/" + response.id + ".jpg", (err, done) => {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/admin");
          }
        });
      } else {
        alert("no image found to delete");
      }
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
    image.mv("./public/HOTEL/" + id + ".jpg", (err, done) => {
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
    console.log("view hotel called");
    res.render("admin/viewhotels", { hotel, admin: true });
  });
});
router.post("/deletehotel", (req, res) => {
  deleteHotel(req.body.id, req.body.Destination).then((response) => {
    if (response.status) {
      console.log("dlete hotel called");
      fs.unlink("./public/HOTEL/" + req.body.id + ".jpg", (err, done) => {
        if (err) {
          console.log(err);
        } else {
          res.json({ status: true });
        }
      });
    }
  });
});
router.get("/edithotel", async (req, res) => {
  console.log(req.query.Destination);
  hotel = await getHotel(req.query.id, req.query.Destination);
  if (hotel) {
    console.log(hotel);
    res.render("admin/edithotel", { hotel });
  }
});
router.post("/edithotel/:id", (req, res) => {
  console.log(req.body);
  let destination = [];
  destination.push(req.body.destination);
  console.log(destination);

  editHotel(req.params.id, req.body).then((response) => {
    res.redirect("/admin/hotels");
    if (req.files.image) {
      let id = req.params.id;
      let image = req.files.image;
      image.mv("./public/HOTEL/" + id + ".jpg");
    }
  });
});
router.get("/customers", async (req, res) => {
  let userCount = await getusers();
  res.render("admin/customers", { userCount, admin: true });
});
router.post("/deleteuser", async (req, res) => {
  await deleteUser(req.body.id).then((response) => {
    res.json({ status: true });
  });
});
module.exports = router;
