var express = require("express");
var router = express.Router();
const { comparearray } = require("../helper/destination_helper");
const {
  hotelLogin,
  addRoom,
  hoteldestination,
  getRoom,
  sortgetRoom,
  editFeatures,
  compareroomarray,
  editroom,
  deleteRoom,
  compareDestination,
  addhotelDestination,
  getroombooking,
  bookedrooms,
  retrieveroom,
  getuserroombooking,
  addfine,
  getuserfine,
} = require("../helper/hotel_helpers");
let fs = require("fs");

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

  let response = await compareDestination(hotel._id);
  let rooms = await getRoom(req.session.hotel);
  res.render("hotels/Home", {
    hotel,
    rooms,
    destination: response.destination,
  });
});

router.post("/", async (req, res) => {
  let hotel = req.session.user;
  let roomsresponse = await sortgetRoom(
    req.session.hotel,
    req.body.destination,
    req.body.roomtype
  );

  let response = await compareDestination(hotel._id);
  res.render("hotels/home", {
    hotel,
    rooms: roomsresponse.rooms,
    place: roomsresponse.destination,
    type: roomsresponse.type,
    destination: response.destination,
  });
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
    res.render("hotels/Hotelfeatures", {
      features: response.hotel,
      notfeature: response.notfeature,
    });
  });
});

router.get("/addroom", async (req, res) => {
  let destination = await hoteldestination(req.session.hotel);

  res.render("hotels/addroom", { destination });
});
router.get("/editroom/:id", verifyuser, async (req, res) => {
  if (req.params.id) {
    await compareroomarray(req.params.id).then((response) => {
      // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>room", response.roomvalue[0]);
      res.render("hotels/editroomfeatures", {
        notfeature: response.notfeature,
        room: response.room,
        roomvalue: response.roomvalue[0],
      });
    });
  } else {
    res.render("hotels/editroomfeatures");
  }
});
router.post("/editroom/:id", (req, res) => {
  if (req.params.id) {
    editroom(req.params.id, req.body).then((response) => {
      res.redirect("/hotel");
      if (req.files.image) {
        let id = req.params.id;
        let image = req.files.image;
        image.mv("./public/HOTEL/" + id + ".jpg");
      }
    });
  } else {
    res.redirect("/hotel");
    alert("error");
  }
});
router.post("/editfeatures", (req, res) => {
  let features = [];
  if (Array.isArray(req.body.features)) {
    for (let i = 0; i < req.body.features.length; i++) {
      features.push(req.body.features[i]);
    }
  } else {
    features.push(req.body.features);
  }
  editFeatures(req.session.hotel._id, features).then((response) => {
    res.redirect("/hotel");
  });
});
router.post("/addroom", (req, res) => {
  req.body.price = +req.body.price;

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
router.post("/deleteroom", (req, res) => {
  deleteRoom(req.body.id).then((response) => {
    if (response.status) {
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
router.get("/destination", verifyuser, async (req, res) => {
  if (req.session.hotel) {
    let hotel = req.session.hotel;

    let response = await compareDestination(hotel._id);

    res.render("hotels/destination", {
      hotel,
      notdestination: response.value,
      destination: response.destination,
    });
  }
});
router.post("/destination/:id", verifyuser, (req, res) => {
  addhotelDestination(req.session.hotel._id, req.body.destination).then(
    (response) => {
      if (response.status) {
        res.redirect("/hotel/destination");
      }
    }
  );
});
router.get("/bookingdetails", verifyuser, async (req, res) => {
  let room = await getroombooking(req.session.hotel);
  res.render("hotels/bookerooms", {
    room: room.roombooking,
  });
});
router.get("/roombooked", verifyuser, async (req, res) => {
  let rooms = await bookedrooms(req.session.hotel._id);
  res.render("hotels/roombooked", { rooms });
});
router.post("/retrieveroom", verifyuser, (req, res) => {
  retrieveroom(req.body.id).then((resposne) => {
    res.json({ status: true });
  });
});
router.get("/fine/", async (req, res) => {
  console.log(req.query.id);
  console.log(req.query.roomnumber);

  let fine = await getuserroombooking(
    req.query.id,
    req.session.hotel,
    req.query.roomnumber
  );
  // console.log("fine>>>>>>>>>>>>>>>>>", fine);
  res.render("hotels/fine", { fine });
});
router.post("/fine", (req, res) => {
  console.log(req.body);
  addfine(req.body, req.session.hotel).then((response) => {
    res.redirect("/hotel/roombooked");
  });
});
router.get("/fines", async (req, res) => {
  let fine = await getuserfine(req.session.hotel);
  res.render("hotels/fines", { fine });
});
module.exports = router;
