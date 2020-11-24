const { destinationCollection } = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");

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
};
