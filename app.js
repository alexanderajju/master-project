var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const hbs = require("express-handlebars");
var admin = require("./routes/admin");
var usersRouter = require("./routes/users");
var HotelRouter = require("./routes/hotels");
const db = require("./config/connection");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const back = require("express-back");
const passport = require("passport");
const { bookingCollection } = require("./config/collections");
require("./passport_config");

var app = express();

let handle = hbs.create({
  extname: "hbs",
  defaultLayout: "layout",
  layoutsDir: __dirname + "/views/layout/",
  partialDir: __dirname + "/views/partials/",

  helpers: {
    calculation: function (value) {
      return value + 7;
    },
    if_eq: function (val1, val2, opts) {
      console.log("time", val1.getTime());
      console.log("time2", val2.getTime());
      if (val1 >= val2) {
        console.log("called");
        return opts.fn(this);
      } else {
        console.log("called else");
        return opts.inverse(this);
      }
    },
  },
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine("hbs", handle.engine);

app.use(express.static(path.join(__dirname, "/public")));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(
  session({
    secret: "key",
    cookie: { maxAge: 600000 },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(back());

db.connect((err) => {
  if (err) {
    console.log("Error Occured" + err);
  } else {
    console.log("[+]DB connected to port 27017");
    async function name() {
      let userbooking = await db
        .get()
        .collection(bookingCollection)
        .aggregate([
          {
            $match: {
              duetime: "2020-12-21T15:44:00.000+00:00",
            },
          },
        ])
        .toArray();
      console.log(userbooking);
      if (userbooking) {
        console.log("asdsadfsdf");
      } else {
        console.log("not equal to zero");
      }
    }
    name();
  }
});

app.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    console.log("req>>>>>>>>>>>>>>>>>>>>>>>>", req.user._json);
    req.session.googleuser = req.user._json;
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

app.use("/admin", admin);
app.use("/", usersRouter);
app.use("/hotel", HotelRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
