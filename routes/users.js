var express = require("express");
const {
  getDestination,
  comparearray,
} = require("../helper/destination_helper");
const {
  sortingHotel,
  getRajpalaceReview,
  getHotelReview,
} = require("../helper/hotel_helpers");
const { getTotalAmount } = require("../helper/admin_helpers");
const {
  doSignUp,
  doLogin,
  getRoom,
  checkoutroom,
  userbooking,
  getuserbooking,
  removeBooking,
  gettotal,
  searchBook,
  verifyPayment,
  changeStatus,
  generaterazorpay,
  useroombooking,
  placeOrder,
  finedetails,
  fineplaceOrder,
  finegeneraterazorpay,
  fineverifyPayment,
  changeFineStatus,
  getUserreview,
  getUserOrders,
  userReview,
  editReview,
  usercancelorder,
  getordertotal,
} = require("../helper/user_helpers");
var fs = require("fs");

var router = express.Router();

const verifyuser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else if (req.session.googleuser) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET users listing. */
router.get("/", async (req, res, next) => {
  if (req.session.googleuser) {
    let googleuser = req.session.googleuser;
    await getDestination().then(async (destination) => {
      if (googleuser) {
        res.render("user/home", { googleuser, destination });
      }
    });
  } else {
    let user = req.session.user;
    await getDestination().then((destination) => {
      if (user) {
        fs.readFile("./public/HOTEL/" + user._id + ".jpg", (err, done) => {
          if (err) {
            console.log(err, done);
            res.render("user/home", { user, destination, done });
          } else {
            res.render("user/home", { user, destination, done });
          }
        });
      } else {
        res.render("user/home", { user, destination });
      }
    });
  }
});
router.get("/profile", verifyuser, async (req, res) => {
  if (req.session.googleuser) {
    let fine = await finedetails(req.session.googleuser._id);
    let rooms = await getUserOrders(req.session.googleuser._id);

    let googleuser = req.session.googleuser;
    res.render("user/profile", { googleuser, fine, rooms });
  } else if (req.session.user.customer) {
    let user = req.session.user;
    res.render("user/profile", { user });
  } else if (req.session.user.hotel) {
    res.redirect("/hotel");
  } else {
    res.redirect("/admin");
  }
});
router.get("/login", (req, res) => {
  if (req.session.googleuser) {
    return res.back(req.session);
  } else if (req.session.user) {
    return res.back(req.session);
  } else if (req.session.hotel) {
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
  if (req.session.user) {
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

            // console.log(rating);
            res.render("user/hotels", { user, hotels, done, place });
          } else {
            place = req.query.place;
            res.render("user/hotels", { user, hotels, done, place });
          }
        });
      } else {
        console.log("page called");
        place = req.query.place;
        res.render("user/hotels", { hotels, user, place });
      }
    }
  } else if (req.session.googleuser) {
    if (req.session.googleuser) {
      if (req.query.id) {
        let googleuser = req.session.googleuser;
        place = req.query.place;
        id = req.query.id;
        hotels = await sortingHotel(place, id);
        console.log(hotels);
        res.render("user/hotels", { googleuser, hotels, place });
      }
    }
  } else {
    place = req.query.place;
    id = req.query.id;
    hotels = await sortingHotel(place, id);
    console.log(hotels);
    res.render("user/hotels", { hotels });
  }
});
router.post("/search", async (req, res) => {
  let count = 0;
  for (let index = 0; index < req.body.count.length; index++) {
    const element = +req.body.count[index];
    count += element;
  }
  req.body.count = count;

  let roomcount = 0;
  if (req.body.count % 3 === 0) {
    roomcount = req.body.count / 3;
  } else {
    roomcount = req.body.count / 3;
    roomcount += 1;
  }
  // req.body.roomcount = roomcount.toFixed(); //it will give string
  req.body.roomcount = Math.trunc(roomcount); //it will give integer

  let destinations = await getDestination();
  let hotels = "";
  if (req.body.Destination) {
    hotels = await sortingHotel(req.body.Destination);
  }

  res.render("user/searchhotels", {
    destinations,
    hotels,
    place: req.body.Destination,
    query: req.body,
  });
});
router.get("/viewrooms", verifyuser, async (req, res) => {
  if (req.session.user) {
    let rooms = "";
    let user = req.session.user;
    if (req.query.id) {
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
      let user = req.session.user;
      res.render("user/viewrooms", { rooms, user });
    }
  } else {
    if (req.session.googleuser) {
      let googleuser = req.session.googleuser;
      rooms = await getRoom(req.query.id, req.query.hotel);
      feature = await comparearray(req.query.id);
      console.log(req.query);
      res.render("user/viewrooms", {
        rooms,
        feature: feature.hotel,
        googleuser,
        query: req.query,
      });
    }
  }
});
router.get("/favico.ico", verifyuser, (req, res) => {
  res.redirect("/");
});
router.get("/checkout", verifyuser, async (req, res) => {
  room = await checkoutroom(req.query.id);

  res.render("user/checkout", { room });
});
router.post("/checkout", verifyuser, (req, res) => {
  console.log(req.body);
  let totalcount = parseInt(req.body.adults) + parseInt(req.body.children);
  req.body.bookingTime = new Date();
  var closingTime = new Date();
  closingTime.setHours(closingTime.getHours() + 2);
  req.body.closingTime = closingTime;

  if (totalcount > 3) {
    res.render("user/checkout", {
      err: "Not more than 3 people",
      room: req.body,
    });
  } else {
    console.log(req.session.googleuser);
    userbooking(req.body, req.session.googleuser).then((response) => {
      res.redirect("/");
    });
  }
});
router.get("/booking", verifyuser, async (req, res) => {
  let rooms = await getuserbooking(req.session.googleuser._id);
  let total = await gettotal(req.session.googleuser._id);
  let date = new Date();

  res.render("user/booking", { rooms: rooms, total, date });
});
router.post("/removebooking", verifyuser, (req, res) => {
  removeBooking(req.session.googleuser._id, req.body.id).then((resposnse) => {
    res.json({ status: true });
  });
});
router.post("/searchbooking", verifyuser, (req, res) => {
  // console.log(req.body);

  if (req.body.roomcount == 1) {
    console.log("called rrom=1");

    res.render("user/searchcheckout3", {
      data: req.body,
      googleuser: req.session.googleuser,
    });
  } else {
    res.render("user/searchcheckout", {
      data: req.body,
      googleuser: req.session.googleuser,
    });
  }
});
router.post("/searchcheckout", verifyuser, (req, res) => {
  delete req.body.userid;
  req.body.roomcount = +req.body.roomcount;
  let googleuser = req.session.googleuser;

  let dateobj1 = new Date(req.body.checkin);
  let dateobj2 = new Date(req.body.checkout);

  req.body.checkin = dateobj1;
  req.body.checkout = dateobj2;
  req.body.bookingTime = new Date();
  var closingTime = new Date();
  closingTime.setHours(closingTime.getHours() + 2);
  req.body.closingTime = closingTime;
  console.log(req.body);
  searchBook(req.body, googleuser, req.body.roomcount).then((response) => {
    if (!response) {
      res.redirect("/");
    }
    if (response.status) {
      date = new Date(response.data.checkin);
      year = date.getFullYear();
      month = date.getMonth() + 1;
      dt = date.getDate();

      if (dt < 10) {
        dt = "0" + dt;
      }
      if (month < 10) {
        month = "0" + month;
      }

      let checkin = year + "-" + month + "-" + dt;
      dateout = new Date(response.data.checkout);
      yearout = dateout.getFullYear();
      monthout = dateout.getMonth() + 1;
      dtout = dateout.getDate();

      if (dtout < 10) {
        dtout = "0" + dtout;
      }
      if (monthout < 10) {
        monthout = "0" + monthout;
      }

      let checkout = yearout + "-" + monthout + "-" + dtout;
      response.data.checkin = checkin;
      response.data.checkout = checkout;

      let googleuser = req.session.googleuser;

      console.log("roomdata called");
      res.render("user/searchcheckout2", {
        err: response.status,
        data: response.data,
        length: response.roomlength,
        destination: response.destination,
        googleuser: googleuser,
      });
    } else {
      res.redirect("/");
    }
  });
});
router.get("/place_order", verifyuser, (req, res) => {
  res.render("user/placeOrder");
});

router.post("/place_order", verifyuser, async (req, res) => {
  let googleuser = req.session.googleuser;
  let booking = await useroombooking(googleuser._id);
  let total = await gettotal(googleuser._id);
  placeOrder(req.body, booking, total, googleuser._id).then((orderId) => {
    if (req.body.payment == "COD") {
      res.json({ codSuccess: true });
    } else {
      generaterazorpay(orderId, total).then((response) => {
        res.json(response);
      });
    }
  });
});
router.post("/verify-payment", verifyuser, async (req, res) => {
  let googleuser = req.session.googleuser;
  let booking = await useroombooking(googleuser._id);
  verifyPayment(req.body, booking, googleuser._id)
    .then((razorpayid) => {
      changeStatus(req.body["order[receipt]"], razorpayid).then(() => {
        console.log("changeSTATUS" + req.body["order[receipt]"]);
        console.log("payment Successful");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log("Payment failed");
      res.json({ status: false });
    });
});
router.get("/fine", verifyuser, async (req, res) => {
  let fine = await finedetails(req.session.googleuser._id);
  // console.log(fine.length);

  res.render("user/fine", { fine });
});
router.post("/fine_place_order", verifyuser, (req, res) => {
  // console.log(req.body);
  let googleuser = req.session.googleuser;

  fineplaceOrder(req.body, googleuser._id).then((orderId) => {
    finegeneraterazorpay(orderId, req.body.total).then((response) => {
      res.json(response);
    });
  });
});
router.post("/fine-verify-payment", verifyuser, (req, res) => {
  fineverifyPayment(req.body, req.session.googleuser._id)
    .then(() => {
      changeFineStatus(req.body.roomid).then((response) => {
        console.log("payment Successful");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log("Payment failed");
      res.json({ status: false });
    });
});
router.get("/userreview", verifyuser, async (req, res) => {
  let rooms = await getUserOrders(req.session.googleuser._id);

  res.render("user/roombooked", { rooms });
});
router.post("/userreview", verifyuser, (req, res) => {
  console.log(req.body);
  res.render("user/review", { data: req.body });
});
router.post("/review", verifyuser, (req, res) => {
  console.log(req.body);
  userReview(req.body, req.session.googleuser._id).then((response) => {
    res.redirect("/profile");
  });
});
router.get("/hotelReview", verifyuser, async (req, res) => {
  // res.send(req.query);
  let review = await getHotelReview(req.query);
  res.render("user/hotelReview", { review });
});
router.post("/edituserreview", verifyuser, (req, res) => {
  getUserreview(req.body, req.session.googleuser._id).then((response) => {
    res.render("user/editReview", { data: response[0] });
  });
});
router.put("/review", verifyuser, (req, res) => {
  editReview(req.body, req.session.googleuser._id).then(() => {
    res.json({ status: true });
  });
});
router.post("/userordercancel", async (req, res) => {
  console.log(req.body);
  let total = 0;
  total = await getordertotal(req.body.id);
  usercancelorder(req.body, total).then((response) => {
    console.log("resposne>>>>>>>>>>", response);
    res.json({ status: true, notes: response.notes });
  });
});

module.exports = router;
