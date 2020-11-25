const {
  destinationCollection,
  hotelCollection,
  roomCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const { resolve } = require("promise");
const { response } = require("express");

module.exports = {
  hotelsignup: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let details = [];
      details = [...details, data.Destination];
      data.password = await bcrypt.hash(data.password, 10);
      data.hotel = true;
      data.destination = details;

      db.get()
        .collection(hotelCollection)
        .insertOne(data)
        .then((doc) => {
          console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>", doc);
          response.username = doc.ops[0].username;
          response._id = doc.ops[0]._id;
          response.status = true;
          db.get()
            .collection(destinationCollection)
            .updateOne(
              { Destination: data.Destination },
              {
                $push: {
                  hotels: response._id.toString(),
                },
              }
            );
          resolve(response);
        });
    });
  },
  hotelLogin: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let hotel = await db
        .get()
        .collection(hotelCollection)
        .findOne({ username: data.username });
      if (hotel) {
        bcrypt.compare(data.password, hotel.password).then((status) => {
          if (status) {
            response.user = hotel;
            response.status = true;
            console.log("logged in");
            resolve(response);
          } else {
            console.log("failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("loggin failed");
        resolve({ status: false });
      }
    });
  },
  addDestination: (data, user) => {
    return new Promise((resolve, reject) => {
      // { Destination: 'Banglore' }
      db.get()
        .collection(hotelCollection)
        .updateOne(
          { _id: ObjectId("5fbc8a1035207f1f882c4cf0") },
          {
            $push: {
              destination: data.Destination,
            },
          }
        )
        .then((response) => {
          db.get()
            .collection(destinationCollection)
            .updateOne(
              { Destination: "Banglore" },
              {
                $push: {
                  hotels: "added",
                },
              }
            );
          // resolve(user._id);
        });
    });
  },
  addRoom: (data) => {
    return new Promise((resolve, reject) => {
      let room = {
        name: data.Name,
        Price: data.Price,
        description: data.Description,
      };

      db.get()
        .collection(roomCollection)
        .insertOne(room)
        .then((response) => {
          db.get()
            .collection(hotelCollection)
            .updateOne(
              { _id: ObjectId("5fbb99354dd828252c6f6399") },
              {
                $push: {
                  rooms: response.ops[0]._id,
                },
              }
            );
          resolve(response.ops[0]._id);
        });
    });
  },
  viewHotel: () => {
    return new Promise(async (resolve, reject) => {
      let hotels = await db.get().collection(hotelCollection).find().toArray();
      resolve(hotels);
    });
  },
  sortingHotel: (destination, id) => {
    return new Promise(async (resolve, reject) => {
      let hotels = await db
        .get()
        .collection(hotelCollection)
        .aggregate(
          { $match: { destination: destination } },
          {
            $unwind: "$hotels",
          }
        )
        .toArray();
      resolve(hotels);
    });
  },
  deleteHotel: (id, Destination) => {
    return new Promise(async (resolve, reject) => {
    
      let response = [];
      db.get()
        .collection(hotelCollection)
        .removeOne({ _id: ObjectId(id) });
      response.status = true;
      await db
        .get()
        .collection(destinationCollection)
        .updateOne(
          { Destination: Destination },
          {
            $pull: {
              hotels: { $in: [id.toString()] },
            },
          },
          { multi: true }
        );
      resolve(response);
    });
  },
};
