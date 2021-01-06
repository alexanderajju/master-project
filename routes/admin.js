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
const {
  TotalBooking,
  Orders,
  deleteOrder,
  getallreview,
  deletereview,
  Roomsavailable,
  getTotalAmount,
} = require("../helper/admin_helpers");
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
  let totalbooking = await TotalBooking();
  let availableRooms = await Roomsavailable();
  let getareview = await getallreview();
  let totalAmount = await  getTotalAmount();
  console.log(getareview.length);
  viewHotel().then((response) => {
    let hotelcount = Object.keys(response).length;

    res.render("admin/adminHome", {
      admin: true,
      hotelcount,
      userCount: Object.keys(userCount).length,
      totalbooking: totalbooking,
      availableRooms: availableRooms,
      getareview: getareview.length,
      totalAmount:totalAmount
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

router.get("/Adddestination", verifyAdmin, (req, res) => {
  res.render("admin/addDestination", { admin: true });
});
router.post("/Adddestination", verifyAdmin, (req, res) => {
  addDestination(req.body).then((id) => {
    let image = req.files.image;
    image.mv("./public/HOTEL/" + id + ".jpg", (err, done) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/admin/Adddestination");
      }
    });
  });
});
router.get("/destinations", verifyAdmin, async (req, res) => {
  await getDestination().then((destination) => {
    res.render("admin/Destinations", { destination, admin: true });
  });
});
router.get("/destination", verifyAdmin, (req, res) => {
  let place = req.query.place;
  let id = req.query.id;
  res.render("admin/viewhotels", { admin: true, place, id });
});
router.get("/addhotel", async (req, res) => {
  await getDestination().then((destination) => {
    res.render("admin/addHotel", { admin: true, destination });
  });
});
router.post("/addhotel", verifyAdmin, (req, res) => {
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

router.get("/hotels", verifyAdmin, (req, res) => {
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
router.get("/edithotel", verifyAdmin, async (req, res) => {
  console.log(req.query.Destination);
  hotel = await getHotel(req.query.id, req.query.Destination);
  if (hotel) {
    console.log(hotel);
    res.render("admin/edithotel", { hotel });
  }
});
router.post("/edithotel/:id", verifyAdmin, (req, res) => {
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
router.get("/customers", verifyAdmin, async (req, res) => {
  let userCount = await getusers();
  console.log(userCount);
  res.render("admin/customers", { userCount, admin: true });
});
router.post("/deleteuser", verifyAdmin, async (req, res) => {
  await deleteUser(req.body.id).then((response) => {
    res.json({ status: true });
  });
});
router.get("/orders", verifyAdmin, async (req, res) => {
  let orders = await Orders();
  res.render("admin/temp", { orders });
});
router.post("/deleteorder", verifyAdmin, async (req, res) => {
  await deleteOrder(req.body.id).then((resposnse) => {
    res.json({ status: true, notes: resposnse.notes });
  });
});
router.get("/deletecomment", verifyAdmin, (req, res) => {
  getallreview().then((response) => {
    res.render("admin/review", { response });
  });
});
router.post("/deletecomment", verifyAdmin, (req, res) => {
  deletereview(req.body.id).then((resposnse) => {
    res.json({ status: true });
  });
});

module.exports = router;
