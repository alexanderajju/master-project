const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { userCollection } = require("./config/collections");
const db = require("./config/connection");

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (User, user, done) {
  // User.findById(id, function (err, user) {
  //   done(err, user);
  // });
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "721804909621-rn6hq8k61kgs2ufp2snnhn4bvu44smfl.apps.googleusercontent.com",
      clientSecret: "yrrtsJqB4yFpfVbODH05r_UZ",
      callbackURL: "http://localhost:3000/google/callback",
      
    },
    async (accessToken, refreshToken, profile, done) => {
      // User.findOrCreate({ googleId: profile.id }, function (err, profile) {
      //   return done(err, profile);
      // });
      let user = await db
        .get()
        .collection(userCollection)
        .findOne({ sub: profile.id });
      console.log(profile._json);
      if (user) {
        console.log("user found");
        console.log(user);
        profile._json._id = user._id;
        return done(null, profile);
      } else {
        console.log("user doesn't exit");
        db.get()
          .collection(userCollection)
          .insertOne(profile._json)
          .then((doc) => {
            profile._json._id = doc.ops[0]._id;
            console.log("passport>>>>>>>>>>>>>>>>>>>>>>>");
            console.log(profile._json._id);
            console.log(profile);
          });
        return done(null, profile);
      }
      // console.log(profile);
      // return done(null, profile);
    }
  )
);
