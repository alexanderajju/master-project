const {
  destinationCollection,
  hotelCollection,
  roomCollection,
  orderCollection,
  userCollection,
  fineCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
var generator = require("generate-password");
let fs = require("fs");
const { resolve } = require("path");

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
  addhotelDestination: (id, data) => {
    console.log(id, data);
    return new Promise((resolve, reject) => {
      let place = [];
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          place.push(data[i]);
        }
      } else {
        place.push(data);
      }
      db.get()
        .collection(hotelCollection)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              destination: place,
            },
          }
        );
      resolve({ status: true });
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
      console.log(hotels);
      resolve(hotels);
    });
  },
  editHotel: (id, data) => {
    return new Promise((resolve, reject) => {
      let place = [];
      if (Array.isArray(data.destination)) {
        for (let i = 0; i < data.destination.length; i++) {
          place.push(data.destination[i]);
        }
      } else {
        place.push(req.body.features);
      }

      db.get()
        .collection(hotelCollection)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              Name: data.Name,
              Mobile: data.Mobile,
              username: data.username,
              destination: place,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  editFeatures: (id, data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(hotelCollection)
        .updateOne(
          {
            _id: ObjectId(id),
          },
          {
            $set: {
              features: data,
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
    console.log(data);
    return new Promise((resolve, reject) => {
      data.hotel_id = ObjectId(hotel._id);
      data.hotel = hotel.username;
      data.booking = false;
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
      // console.log("user>>>>>>>>>>>>>>>>>>>>>>>>>", user._id);

      let rooms = await db
        .get()
        .collection(roomCollection)
        .aggregate([
          {
            $match: {
              hotel_id: ObjectId(user._id),
              hotel: user.username,
            },
          },
        ])
        .toArray();
      resolve(rooms);
    });
  },
  sortgetRoom: (user, destination, type) => {
    return new Promise(async (resolve, reject) => {
      // console.log("user>>>>>>>>>>>>>>>>>>>>>>>>>", user._id);

      let rooms = await db
        .get()
        .collection(roomCollection)
        .aggregate([
          {
            $match: {
              hotel_id: ObjectId(user._id),
              hotel: user.username,
              Destination: destination,
              roomtype: type,
            },
          },
        ])
        .toArray();
      resolve({ rooms, destination, type });
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
          console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", room);
          console.log(removeCommon(room, features));
          let notfeature = removeCommon(room, features);
          resolve({ notfeature, room, roomvalue });
        } else {
          console.log("called");
          let notfeature = features;
          resolve({ notfeature, room, roomvalue });
        }
      }
    });
  },
  editroom: (id, body) => {
    return new Promise((resolve, reject) => {
      console.log(id, body);
      let features = [];
      features = body.features;
      console.log(features);
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
              features: features,
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
      db.get()
        .collection(roomCollection)
        .removeOne({ _id: ObjectId(id) });

      resolve({ status: true });
    });
  },
  compareDestination: (id) => {
    return new Promise(async (resolve, reject) => {
      let notdestination = [];
      let hoteldestination = await db
        .get()
        .collection(hotelCollection)
        .aggregate([
          {
            $match: { _id: ObjectId(id) },
          },
        ])
        .toArray();

      let destination = await db
        .get()
        .collection(destinationCollection)
        .find()
        .toArray();

      for (let i in destination) {
        // console.log(destination[i].Destination);
        notdestination.push(destination[i].Destination);
      }
      const removeCommon = (first, second) => {
        const spreaded = [...first, ...second];
        return spreaded.filter((el) => {
          return !(first.includes(el) && second.includes(el));
        });
      };
      // console.log("destination>>>>>>>>>>>>>>>", notdestination);
      hoteldestination = hoteldestination[0].destination;
      // console.log(hoteldestination);
      let value = removeCommon(hoteldestination, notdestination);
      // console.log(value);
      resolve({ value, destination: hoteldestination });
    });
  },
  getroombooking: (hotel) => {
    console.log(hotel);
    return new Promise(async (resolve, reject) => {
      let roombooking = await db
        .get()
        .collection(orderCollection)
        .aggregate([
          {
            $match: { "products.hotel": hotel.username },
          },
          {
            $project: {
              mobile: "$deliveryDetails.mobile",
              userId: 1,
              room: {
                $filter: {
                  input: "$products",
                  as: "product",
                  cond: { $eq: ["$$product.hotel", hotel.username] },
                },
              },
            },
          },
          {
            $unwind: "$room",
          },
          {
            $lookup: {
              from: userCollection,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $project: {
              mobile: 1,
              room: 1,
              username: "$user.name",
              user_id: "$user._id",
            },
          },
          {
            $lookup: {
              from: roomCollection,
              localField: "room.roomid",
              foreignField: "_id",
              as: "roomnumber",
            },
          },
          { $unwind: "$roomnumber" },
          {
            $project: {
              mobile: 1,
              room: 1,
              username: 1,
              user_id: 1,
              roomnumber: "$roomnumber.roomnumber",
              checkin: {
                $dateToString: { format: "%Y-%m-%d", date: "$room.checkin" },
              },
              checkout: {
                $dateToString: { format: "%Y-%m-%d", date: "$room.checkout" },
              },
            },
          },
        ])
        .toArray();
      console.log(roombooking);
      resolve({ roombooking: roombooking });
    });
  },
  bookedrooms: (id) => {
    return new Promise(async (resolve, reject) => {
      let rooms = await db
        .get()
        .collection(roomCollection)
        .find({
          hotel_id: ObjectId(id),
          booking: true,
        })
        .toArray();
      resolve(rooms);
      console.log(rooms);
    });
  },
  retrieveroom: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(roomCollection)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: { booking: false },
          }
        );
      resolve();
    });
  },
  getuserroombooking: (id, hotel, roomnumber) => {
    console.log("id", id);
    console.log("hotel", hotel);
    console.log("roomnumber", roomnumber);
    return new Promise(async (resolve, reject) => {
      let roombooking = await db
        .get()
        .collection(orderCollection)
        .aggregate([
          {
            $match: { userId: ObjectId(id) },
          },
          {
            $project: {
              mobile: "$deliveryDetails.mobile",
              userId: 1,
              room: {
                $filter: {
                  input: "$products",
                  as: "product",
                  cond: { $eq: ["$$product.hotel", hotel.username] },
                },
              },
            },
          },
          {
            $unwind: "$room",
          },
          {
            $lookup: {
              from: userCollection,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $project: {
              mobile: 1,
              room: 1,
              username: "$user.name",
              user_id: "$user._id",
            },
          },
          {
            $lookup: {
              from: roomCollection,
              localField: "room.roomid",
              foreignField: "_id",
              as: "roomnumber",
            },
          },
          { $unwind: "$roomnumber" },
          {
            $project: {
              mobile: 1,
              room: 1,
              username: 1,
              user_id: 1,
              roomnumber: "$roomnumber.roomnumber",
              checkin: {
                $dateToString: { format: "%Y-%m-%d", date: "$room.checkin" },
              },
              checkout: {
                $dateToString: { format: "%Y-%m-%d", date: "$room.checkout" },
              },
            },
          },
          {
            $match: { roomnumber: roomnumber },
          },

          // {
          //   $filter: {
          //     cond: { $eq: ["$$roomnumber", roomnumber] },
          //   },
          // },
        ])
        .toArray();
      console.log(roombooking);
      resolve(roombooking);
    });
  },
  addfine: (data, hotel) => {
    return new Promise((resolve, reject) => {
      let fine = {
        hotelname: hotel.username,
        userid: ObjectId(data.userid),
        roomnumber: data.roomnumber,
        total: data.total,
        roomid: ObjectId(data.roomid),
        status: "not paid",
      };
      console.log(data);
      db.get().collection(fineCollection).insertOne(fine);
      resolve();
    });
  },
  getuserfine: (hotel) => {
    // console.log(hotel);
    return new Promise(async (resolve, reject) => {
      let fine = await db
        .get()
        .collection(fineCollection)
        .aggregate([
          { $match: { hotelname: hotel.username } },

          {
            $lookup: {
              from: userCollection,
              localField: "userid",
              foreignField: "_id",
              as: "user",
            },
          },

          { $unwind: "$user" },
          {
            $project: {
              hotelname: 1,
              roomnumber: 1,
              total: 1,
              roomid: 1,
              status: 1,
              name: "$user.name",
              email: "$user.email",
            },
          },
          {
            $lookup: {
              from: roomCollection,
              localField: "roomid",
              foreignField: "_id",
              as: "room",
            },
          },

          { $unwind: "$room" },
        ])
        .toArray();
      console.log(fine);
      resolve(fine);
    });
  },
};
