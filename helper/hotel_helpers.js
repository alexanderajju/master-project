const {
  destinationCollection,
  hotelCollection,
  roomCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
var generator = require("generate-password");
let fs = require("fs");

module.exports = {
  hotelsignup: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let details = [];
      details = [...details, data.Destination];
      let password = generator.generate({
        length: 10,
        numbers: true,
      });
      console.log(password);
      data.password = await bcrypt.hash(password, 10);
      data.hotel = true;
      data.destination = details;

      db.get()
        .collection(hotelCollection)
        .insertOne(data)
        .then((doc) => {
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
          resolve({
            id: doc.ops[0]._id,
            password,
            email: data.email,
            username: data.username,
          });
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
  hoteldestination: (user) => {
    return new Promise(async (resolve, reject) => {
      let hotel = await db
        .get()
        .collection(hotelCollection)
        .aggregate([
          { $match: { _id: ObjectId(user._id) } },
          { $unwind: "$destination" },
          {
            $project: {
              _id: 0,
              item: "$destination",
            },
          },
        ])
        .toArray();
      resolve(hotel);
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
  getHotel: (id, destination) => {
    return new Promise((resolve, reject) => {
      console.log(id, destination);
    });
  },
  editHotel: (id, data) => {
    return new Promise((resolve, reject) => {
      let place = [];
      place.destination = data.destination;

      console.log(place.destination);
      db.get()
        .collection(hotelCollection)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              Name: data.Name,
              Mobile: data.Mobile,
              username: data.username,
              destination: place.destination,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  editFeatures: (id, features) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(hotelCollection)
        .updateOne(
          {
            _id: ObjectId(id),
          },
          {
            $set: {
              features: features,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteHotel: (id, Destination) => {
    console.log(id);
    return new Promise(async (resolve, reject) => {
      let response = [];

      let hotel = await db
        .get()
        .collection(hotelCollection)
        .aggregate([
          {
            $match: { _id: ObjectId(id) },
          },
          {
            $project: {
              _id: 0,
              rooms: 1,
            },
          },
        ])
        .toArray();
      console.log("hotel>>>>>>>>>>>>>>>>>>>>>>>>>>", hotel);

      if (hotel) {
        console.log("called");
        for (let i = 0; i < hotel[0].rooms.length; i++) {
          let rooms_id = hotel[0].rooms;
          console.log(rooms_id[i]);
          fs.unlink("./public/HOTEL/" + rooms_id[i] + ".jpg", (err, done) => {
            if (err) {
              console.log("err while deleting");
              console.log(err);
            } else {
              console.log("room image deleted");
              db.get()
                .collection(roomCollection)
                .remove({ hotel_id: ObjectId(id) });
              console.log("rooms deleted");
              db.get()
                .collection(hotelCollection)
                .removeOne({ _id: ObjectId(id) });
              response.status = true;

              db.get()
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
            }
          });
        }
      } else {
        console.log("no room called");
      }
    });
  },
  getHotel: (id, destination) => {
    return new Promise(async (resolve, reject) => {
      hotel = await db
        .get()
        .collection(hotelCollection)
        .aggregate([
          {
            $match: { _id: ObjectId(id), Destination: destination },
          },
        ])
        .toArray();
      console.log(hotel);
      resolve(hotel[0]);
    });
  },
  addRoom: (data, hotel) => {
    return new Promise((resolve, reject) => {
      data.hotel_id = ObjectId(hotel._id);
      data.hotel = hotel.username;
      db.get()
        .collection(roomCollection)
        .insertOne(data)
        .then((doc) => {
          db.get()
            .collection(hotelCollection)
            .updateOne(
              {
                _id: ObjectId(hotel._id),
              },
              {
                $push: {
                  rooms: doc.ops[0]._id,
                },
              }
            );
          resolve(doc.ops[0]._id);
        });
    });
  },
  getRoom: (user) => {
    return new Promise(async (resolve, reject) => {
      console.log("user>>>>>>>>>>>>>>>>>>>>>>>>>", user._id);
      let rooms = await db
        .get()
        .collection(roomCollection)
        .aggregate([
          { $match: { hotel_id: ObjectId(user._id), hotel: user.username } },
        ])
        .toArray();
      resolve(rooms);
    });
  },
  compareroomarray: (id) => {
    return new Promise(async (resolve, reject) => {
      // console.log("id>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", id);
      if (id) {
        let room = await db
          .get()
          .collection(roomCollection)
          .aggregate([
            {
              $match: { _id: ObjectId(id) },
            },
          ])
          .toArray();

        let features = await db
          .get()
          .collection("features")
          .aggregate([
            {
              $match: { _id: ObjectId("5fc63ac1c8c4f0938e6ba523") },
            },
          ])
          .toArray();
        var roomvalue = room;
        // hotel = hotel[0].features;
        features = features[0].roomfeatures;
        room = room[0].features;
        // console.log("room>>>>>>>>>>>>>>>>>>>>>>", room);
        if (room) {
          const removeCommon = (first, second) => {
            const spreaded = [...first, ...second];
            return spreaded.filter((el) => {
              return !(first.includes(el) && second.includes(el));
            });
          };
          let notfeature = removeCommon(room, features);
          // console.log(removeCommon(room, features));
          resolve({ notfeature, room, roomvalue });
        } else {
          let notfeature = features;
          resolve({ notfeature, room, roomvalue });
        }
      }
    });
  },
  editroom: (id, body) => {
    return new Promise((resolve, reject) => {
      console.log(id, body);
      db.get()
        .collection(roomCollection)
        .updateOne(
          {
            _id: ObjectId(id),
          },
          {
            $set: {
              roomnumber: body.roomnumber,
              price: body.price,
              description: body.description,
              Destination: body.Destination,
              features: body.features,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteRoom: (id) => {
    return new Promise(async (resolve, reject) => {
      let response = [];
      db.get()
        .collection(roomCollection)
        .removeOne({ _id: ObjectId(id) });
      response.status = true;
      resolve(response);
    });
  },
};
