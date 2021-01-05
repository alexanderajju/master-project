const {
  destinationCollection,
  hotelCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  addDestination: (destination) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(destinationCollection)
        .insertOne(destination)
        .then((data) => {
          console.log(data.ops[0]._id);
          resolve(data.ops[0]._id);
        });
    });
  },
  getDestination: () => {
    return new Promise(async (resolve, reject) => {
      let destination = await db
        .get()
        .collection(destinationCollection)
        .find()
        .toArray();

      resolve(destination);
    });
  },
  DestinationName: () => {
    return new Promise(async (resolve, reject) => {
      let destination = await db
        .get()
        .collection(destinationCollection)
        .find()
        .toArray();

      resolve(destination.Destination);
    });
  },
  comparearray: (id) => {
    return new Promise(async (resolve, reject) => {
      let hotel = await db
        .get()
        .collection(hotelCollection)
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
            $match: { _id: ObjectId("5ff44888dd6a68e6b520001e") },
          },
        ])
        .toArray();
      console.log(features);
      features = features[0].features;
      hotel = hotel[0].features;
      if (hotel) {
        const removeCommon = (first, second) => {
          const spreaded = [...first, ...second];
          return spreaded.filter((el) => {
            return !(first.includes(el) && second.includes(el));
          });
        };
        console.log(">>>>>>>>>>>>>>>>>>>>>", hotel);
        console.log(features);
        console.log(removeCommon(hotel, features));
        let notfeature = removeCommon(hotel, features);
        resolve({ notfeature, hotel });
      } else {
        let notfeature = features;
        resolve({ notfeature, hotel });
      }
    });
  },
};
