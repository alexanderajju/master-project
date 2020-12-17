var express = require("express");
const {
  getDestination,
  comparearray,
} = require("../helper/destination_helper");
const { sortingHotel, compareroomarray } = require("../helper/hotel_helpers");
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
} = require("../helper/user_helpers");
var fs = require("fs");
const { ifError } = require("assert");

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
    await getDestination().then((destination) => {
      if (googleuser) {
        res.render("user/home", { googleuser, destination });
      }
    });
  } else {
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
  }
});
router.get("/profile", verifyuser, (req, res) => {
  if (req.session.googleuser) {
    let googleuser = req.session.googleuser;
    res.render("user/profile", { googleuser });
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
  } else if (req.session.googleuser) {
    if (req.session.googleuser) {
      if (req.query.id) {
        let googleuser = req.session.googleuser;
        place = req.query.place;
        id = req.query.id;
        hotels = await sortingHotel(place, id);
        res.render("user/hotels", { googleuser, hotels, place });
      }
    }
  } else {
    place = req.query.place;
    id = req.query.id;
    hotels = await sortingHotel(place, id);
    res.render("user/hotels", { hotels });
  }
});
router.post("/search", verifyuser, async (req, res) => {
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
  // res.send(req.body);
  console.log(roomcount);
  console.log(req.body);
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
  } else {
    if (req.session.googleuser) {
      let googleuser = req.session.googleuser;
      rooms = await getRoom(req.query.id, req.query.hotel);
      feature = await comparearray(req.query.id);

      res.render("user/viewrooms", {
        rooms,
        feature: feature.hotel,
        googleuser,
      });
    }
  }
});
router.get("/favico.ico", (req, res) => {
  res.redirect("/");
});
router.get("/checkout", verifyuser, async (req, res) => {
  room = await checkoutroom(req.query.id);

  res.render("user/checkout", { room });
});
router.post("/checkout", verifyuser, (req, res) => {
  userbooking(req.body, req.session.googleuser).then((response) => {
    console.log(response);
    res.redirect("/");
  });
});
router.get("/booking", verifyuser, async (req, res) => {
  let rooms = await getuserbooking(req.session.googleuser._id);
  let total = await gettotal(req.session.googleuser._id);
  console.log(total.length);
  res.render("user/booking", { rooms, total });
});
router.post("/removebooking", verifyuser, (req, res) => {
  console.log(req.session.googleuser._id);
  console.log(req.body.id);

  removeBooking(req.session.googleuser._id, req.body.id).then((resposnse) => {
    res.json({ status: true });
  });
});
router.post("/searchbooking", verifyuser, (req, res) => {
  console.log(req.body);
  console.log(req.session.googleuser);

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
  console.log(req.body);
  delete req.body.userid;
  req.body.roomcount = +req.body.roomcount;
  let googleuser = req.session.googleuser;
  req.body.checkin = new Date(req.body.checkin);
  req.body.checkout = new Date(req.body.checkout);
  // console.log(googleuser);
  console.log(req.body);
  searchBook(req.body, googleuser, req.body.roomcount).then((response) => {
    console.log(response);
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

router.post("/place_order", async (req, res) => {
  let booking = await useroombooking();
  let total = await gettotal((id = "5fd1a5e74a9a9a35043635e7"));
  placeOrder(req.body, booking, total).then((orderId) => {
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
  let booking = await useroombooking();
  verifyPayment(req.body, booking)
    .then(() => {
      changeStatus(req.body["order[receipt]"]).then(() => {
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
module.exports = router;
