const {
  userCollection,
  hotelCollection,
  roomCollection,
  bookingCollection,
  orderCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const ObjectId = require("mongodb").ObjectId;
const { resolve, reject } = require("promise");
const { response } = require("express");

module.exports = {
  TotalBooking: () => {
    return new Promise(async (resolve, reject) => {
      let totalBooking = await db
        .get()
        .collection(orderCollection)
        .aggregate([
          {
            $match: { status: "placed" },
          },
        ])
        .toArray();
      resolve(totalBooking.length);
    });
  },
  Orders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(orderCollection)
        .aggregate([
          {
            $project: {
              id: 1,
              userId: 1,
              paymentMethod: 1,
              products: 1,
              totalAmount: 1,
              status: 1,
            },
          },
          { $unwind: "$products" },
          {
            $project: {
              id: 1,
              userId: 1,
              paymentMethod: 1,
              totalAmount: 1,
              status: 1,
              roomid: "$products.roomid",
              roomname: "$products.hotel",
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
          {
            $lookup: {
              from: userCollection,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },

          {
            $project: {
              id: 1,
              userId: 1,
              paymentMethod: 1,
              totalAmount: 1,
              status: 1,
              roomno: "$room.roomnumber",
              hotel: "$room.hotel",
            },
          },
          {
            $unwind: {
              path: "$roomno",
            },
          },
          {
            $group: {
              _id: "$_id",
              list_data: { $addToSet: "$roomno" },
              userId: { $addToSet: "$userId" },
              hotel: { $addToSet: "$hotel" },
              paymentMethod: { $addToSet: "$paymentMethod" },
              totalAmount: { $addToSet: "$totalAmount" },
              status: { $addToSet: "$status" },
            },
          },
          { $unwind: "$hotel" },
          {
            $lookup: {
              from: userCollection,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },

          {
            $project: {
              _id: 1,
              list_data: 1,
              userId: 1,
              paymentMethod: 1,
              totalAmount: 1,
              status: 1,
              user: "$user.name",
              hotel: 1,
            },
          },
        ])
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },
  deleteOrder: (id) => {
    let roomidarray = [];
    console.log(id);
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(orderCollection)
        .aggregate([
          { $match: { _id: ObjectId(id) } },
          { $unwind: "$products" },
          {
            $project: {
              roomid: "$products.roomid",
            },
          },
        ])
        .toArray();
      console.log(orders.length);
      // console.log(orders[0].roomid);
      // console.log(orders[1].roomid);
      for (let index = 0; index < orders.length; index++) {
        const roomid = orders[index].roomid;
        console.log(roomid);
        roomidarray.push(roomid);
        db.get()
          .collection(roomCollection)
          .updateOne(
            {
              _id: ObjectId(roomid),
            },
            {
              $set: {
                booking: false,
              },
            }
          )
          .then((response) => {
            db.get()
              .collection(orderCollection)
              .removeOne({ _id: ObjectId(id) });
          });
      }
      console.log(roomidarray);
      resolve();
    });
  },
};
