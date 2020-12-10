const {
  userCollection,
  hotelCollection,
  roomCollection,
  bookingCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const bcrypt = require("bcrypt");
const { resolve } = require("promise");
const { response } = require("express");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  doSignUp: (data) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      data.password = await bcrypt.hash(data.password, 10);
      data.customer = true;
      db.get()
        .collection(userCollection)
        .insertOne(data)
        .then((doc) => {
          response.username = doc.ops[0].username;
          response.status = true;
          resolve(response);
        });
    });
  },
  doLogin: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      let user =
        (await db
          .get()
          .collection(userCollection)
          .findOne({ username: data.username })) ||
        (await db
          .get()
          .collection(hotelCollection)
          .findOne({ username: data.username }));

      if (user) {
        bcrypt.compare(data.password, user.password).then((status) => {
          if (status) {
            response.username = user;
            response.status = true;
            console.log("logged in");
            resolve(response);
          } else {
            console.log(" failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  doAdminLogIn: (data) => {
    // console.log("..............", data);
    return new Promise(async (resolve, reject) => {
      let resposnse = {};
      let user = await db
        .get()
        .collection(userCollection)
        .findOne({ username: data.username });
      //   console.log(user);
      if (user) {
        if (user.admin) {
          bcrypt.compare(data.password, user.password).then((status) => {
            if (status) {
              console.log("login Success");
              resposnse.username = user;
              resposnse.status = true;
              resolve(resposnse);
            } else {
              console.log("failed");
              resolve({ status: false });
            }
          });
        } else {
          console.log("login failed");
          resolve({ status: false });
        }
      } else {
        resolve({ status: false });
      }
    });
  },
  getusers: () => {
    return new Promise(async (resolve, reject) => {
      let test = await db
        .get()
        .collection(userCollection)
        .aggregate([
          {
            $match: { customer: true },
          },
        ])
        .toArray();
      if (test) {
        resolve(test);
        console.log(Object.keys(test).length);
      } else {
        resolve(0);
      }
    });
  },
  deleteUser: (id) => {
    return new Promise((resolve, reject) => {
      let response = [];
      db.get()
        .collection(userCollection)
        .removeOne({ _id: ObjectId(id) });
      response.status = true;
      resolve(response);
    });
  },
  getRoom: (id, hotel) => {
    return new Promise(async (resolve, reject) => {
      let rooms = await db
        .get()
        .collection(roomCollection)
        .aggregate([
          {
            $match: {
              hotel_id: ObjectId(id),
              Destination: hotel,
            },
          },
        ])
        .toArray();
      console.log("rooms>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", rooms);
      resolve(rooms);
    });
  },
  checkoutroom: (id) => {
    return new Promise(async (resolve, reject) => {
      let rooms = await db
        .get()
        .collection(roomCollection)
        .findOne({ _id: ObjectId(id) });
      resolve(rooms);
    });
  },
  userbooking: (data, user) => {
    let bookings = {
      userid: ObjectId(user._id),
      booking: [data],
    };
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(bookingCollection)
        .findOne({ userid: ObjectId(user._id) });

      if (orders) {
        console.log(orders.booking);
        console.log("booking id exists");
        let roomexist = orders.booking.findIndex(
          (room) => room.roomid == data.roomid
        );
        console.log(roomexist);
        if (roomexist != -1) {
          console.log("room already booked");
          resolve({ status: "Room already booked" });
        } else {
          db.get()
            .collection(bookingCollection)
            .updateOne(
              { userid: ObjectId(user._id) },
              { $push: { booking: data } }
            );
          resolve();
        }
      } else {
        console.log("not found");
        db.get()
          .collection(bookingCollection)
          .insertOne(bookings)
          .then((resposnse) => {
            resolve();
          });
      }
    });
  },
};
