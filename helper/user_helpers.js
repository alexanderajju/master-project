const {
  userCollection,
  hotelCollection,
  roomCollection,
  bookingCollection,
  orderCollection,
  fineCollection,
  finepaymentCollection,
} = require("../config/collections");
const db = require("../config/connection");
const Promise = require("promise");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const schedule = require("node-schedule");

var instance = new Razorpay({
  key_id: "rzp_test_2wER6mnpGYCPCq",
  key_secret: "aijrQJALtn6kCNXtUADXi8hw",
});

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
              booking: false,
            },
          },
        ])
        .toArray();

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
    console.log(data);
    data.checkin = new Date(data.checkin);
    data.checkout = new Date(data.checkout);
    data.roomid = ObjectId(data.roomid);
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
  getuserbooking: (userid) => {
    return new Promise(async (resolve, reject) => {
      let rooms = [];
      let orders = await db
        .get()
        .collection(bookingCollection)
        .aggregate([
          { $match: { userid: ObjectId(userid) } },
          { $unwind: "$booking" },
          {
            $project: {
              bookingTime: "$booking.bookingTime",
              closingTime:"$booking.closingTime",
              roomid: "$booking.roomid",
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
            $unwind: "$room",
          },
        ])
        .toArray();

      if (orders) {
        resolve(orders);
      } else {
        resolve();
      }
    });
  },
  removeBooking: (userid, roomid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(bookingCollection)
        .updateOne(
          {
            userid: ObjectId(userid),
          },
          {
            $pull: { booking: { roomid: ObjectId(roomid) } },
          }
        );
      resolve();
    });
  },
  gettotal: (id) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(bookingCollection)
        .aggregate([
          {
            $match: {
              userid: ObjectId(id),
            },
          },
          {
            $unwind: "$booking",
          },
          {
            $project: {
              roomid: "$booking.roomid",
              hotel: "$booking.hotel",
              checkin: "$booking.checkin",
              checkout: "$booking.checkout",
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
            $project: {
              roomid: 1,
              hotel: 1,
              dayssince: {
                $trunc: {
                  $divide: [
                    { $subtract: ["$checkout", "$checkin"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
              dateDifference: {
                $trunc: { $subtract: ["$checkout", "$checkin"] },
              },
              room: { $arrayElemAt: ["$room", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$dayssince", "$room.price"] } },
            },
          },
        ])
        .toArray();
      if (total.length != 0) {
        resolve(total[0].total);
      } else {
        total = 0;
        resolve(total);
      }
    });
  },
  searchBook: (data, user, roomcount) => {
    // console.log(data);
    let userid = user._id;
    let roomid = [];
    let roomlength;
    let destination = data.Destination;
    let roomexist;

    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(bookingCollection)
        .findOne({ userid: ObjectId(user._id) });
      let rooms = await db
        .get()
        .collection(roomCollection)
        .find({
          hotel: data.hotel,
          booking: false,
          Destination: data.Destination,
          roomtype: data.roomtype,
        })
        .toArray();
      // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>rooms", rooms);
      roomlength = rooms.length;

      delete data.Destination;
      delete data.roomcount;
      if (rooms.length === 0) {
        resolve({
          status: "no room available for now please try later",
          roomlength: roomlength,
          destination: destination,
          data: data,
        });
      } else if (rooms.length <= roomcount - 1) {
        resolve({
          status: "not enough room please decrease room count",
          roomlength: roomlength,
          destination: destination,
          data: data,
        });
      } else {
        for (let index = 0; index < roomcount; index++) {
          const element = rooms[index]._id;
          roomid.push(element);
        }
        // console.log(rooms);
        if (orders) {
          console.log("booking id exists");

          for (let index = 0; index < roomid.length; index++) {
            data.roomid = ObjectId(roomid[index]);
            roomexist = orders.booking.findIndex(
              (room) => room.roomid.toString() == roomid[index].toString()
            );

            // console.log(roomexist);
            if (roomexist != -1) {
              console.log("room already added");
              resolve({
                status: "Room already added",
                roomlength: roomlength,
                destination: destination,
                data: data,
              });
            } else {
              db.get()
                .collection(bookingCollection)
                .updateOne(
                  { userid: ObjectId(user._id) },
                  { $push: { booking: data } }
                );

              // var date = new Date();
              // date.setMinutes(date.getMinutes() + 2);
              // // console.log(date);
              // var j = schedule.scheduleJob(date, async function () {
              //   let userbooking = await db
              //     .get()
              //     .collection(bookingCollection)
              //     .findOne({ userid: ObjectId(userid) });

              //   console.log(userbooking.userid);
              //   // console.log(date);
              //   console.log("scheduleJob called");
              //   let products = await db
              //     .get()
              //     .collection(bookingCollection)
              //     .findOne({ userid: ObjectId(userbooking.userid) });

              //   if (userbooking.booking.length != 0) {
              //     let total = await db
              //       .get()
              //       .collection(bookingCollection)
              //       .aggregate([
              //         {
              //           $match: {
              //             userid: ObjectId(userbooking.userid),
              //           },
              //         },
              //         {
              //           $unwind: "$booking",
              //         },
              //         {
              //           $project: {
              //             roomid: "$booking.roomid",
              //             hotel: "$booking.hotel",
              //             checkin: "$booking.checkin",
              //             checkout: "$booking.checkout",
              //           },
              //         },
              //         {
              //           $lookup: {
              //             from: roomCollection,
              //             localField: "roomid",
              //             foreignField: "_id",
              //             as: "room",
              //           },
              //         },
              //         {
              //           $project: {
              //             roomid: 1,
              //             hotel: 1,
              //             dayssince: {
              //               $trunc: {
              //                 $divide: [
              //                   { $subtract: ["$checkout", "$checkin"] },
              //                   1000 * 60 * 60 * 24,
              //                 ],
              //               },
              //             },
              //             dateDifference: {
              //               $trunc: { $subtract: ["$checkout", "$checkin"] },
              //             },
              //             room: { $arrayElemAt: ["$room", 0] },
              //           },
              //         },
              //         {
              //           $group: {
              //             _id: null,
              //             total: {
              //               $sum: {
              //                 $multiply: ["$dayssince", "$room.price"],
              //               },
              //             },
              //           },
              //         },
              //       ])
              //       .toArray();
              //     // let total = await gettotal(user._id);
              //     console.log(
              //       userbooking.userid,
              //       products.booking,
              //       total[0].total
              //     );
              //     console.log("The world is going to end today.");

              //     let orderObject = {
              //       deliveryDetails: {
              //         mobile: data.mobile,
              //       },
              //       userId: ObjectId(userbooking.userid),
              //       paymentMethod: "COD",
              //       products: products.booking,
              //       totalAmount: total[0].total,
              //       status: "placed",
              //       date: new Date(),
              //     };
              //     console.log(orderObject);

              //     db.get()
              //       .collection(orderCollection)
              //       .insertOne(orderObject)
              //       .then((response) => {
              //         resolve(response.ops[0]._id);

              //         db.get()
              //           .collection(bookingCollection)
              //           .removeOne({
              //             userid: ObjectId(userbooking.userid),
              //           });
              //         for (
              //           let index = 0;
              //           index < products.booking.length;
              //           index++
              //         ) {
              //           const roomid = products.booking[index].roomid;

              //           db.get()
              //             .collection(roomCollection)
              //             .updateOne(
              //               {
              //                 _id: ObjectId(roomid),
              //               },
              //               {
              //                 $set: {
              //                   booking: true,
              //                 },
              //               }
              //             );
              //           console.log(roomid + "updated");
              //         }
              //         console.log("Order placed");
              //       });
              //   } else {
              //     console.log("no booking found in the cart");
              //   }
              // });
              resolve();
            }
            // roomid = [];
          }
          if (roomexist != -1) {
            console.log("room already added");
            // resolve({ status: "Room already added" });
          }
        } else {
          console.log("not found");
          let bookings = {
            userid: ObjectId(user._id),
            booking: [],
          };
          db.get()
            .collection(bookingCollection)
            .insertOne(bookings)
            .then((resposnse) => {
              for (let index = 0; index < roomid.length; index++) {
                data.roomid = ObjectId(roomid[index]);
                db.get()
                  .collection(bookingCollection)
                  .updateOne(
                    { userid: ObjectId(user._id) },
                    { $push: { booking: data } }
                  );
              }
              // var date = new Date();
              // date.setMinutes(date.getMinutes() + 2);
              // console.log(date);
              // var j = schedule.scheduleJob(date, async function () {
              //   let userbooking = await db
              //     .get()
              //     .collection(bookingCollection)
              //     .findOne({ userid: ObjectId(userid) });

              //   console.log(userbooking.userid);
              //   console.log(date);
              //   console.log("scheduleJob called");
              //   let products = await db
              //     .get()
              //     .collection(bookingCollection)
              //     .findOne({ userid: ObjectId(userbooking.userid) });
              //   if (userbooking.booking.length != 0) {
              //     let total = await db
              //       .get()
              //       .collection(bookingCollection)
              //       .aggregate([
              //         {
              //           $match: {
              //             userid: ObjectId(userbooking.userid),
              //           },
              //         },
              //         {
              //           $unwind: "$booking",
              //         },
              //         {
              //           $project: {
              //             roomid: "$booking.roomid",
              //             hotel: "$booking.hotel",
              //             checkin: "$booking.checkin",
              //             checkout: "$booking.checkout",
              //           },
              //         },
              //         {
              //           $lookup: {
              //             from: roomCollection,
              //             localField: "roomid",
              //             foreignField: "_id",
              //             as: "room",
              //           },
              //         },
              //         {
              //           $project: {
              //             roomid: 1,
              //             hotel: 1,
              //             dayssince: {
              //               $trunc: {
              //                 $divide: [
              //                   { $subtract: ["$checkout", "$checkin"] },
              //                   1000 * 60 * 60 * 24,
              //                 ],
              //               },
              //             },
              //             dateDifference: {
              //               $trunc: { $subtract: ["$checkout", "$checkin"] },
              //             },
              //             room: { $arrayElemAt: ["$room", 0] },
              //           },
              //         },
              //         {
              //           $group: {
              //             _id: null,
              //             total: {
              //               $sum: { $multiply: ["$dayssince", "$room.price"] },
              //             },
              //           },
              //         },
              //       ])
              //       .toArray();
              //     // let total = await gettotal(user._id);
              //     console.log(
              //       userbooking.userid,
              //       products.booking,
              //       total[0].total
              //     );
              //     console.log("The world is going to end today.");

              //     let orderObject = {
              //       deliveryDetails: {
              //         mobile: data.mobile,
              //       },
              //       userId: ObjectId(userbooking.userid),
              //       paymentMethod: "COD",
              //       products: products.booking,
              //       totalAmount: total[0].total,
              //       status: "placed",
              //       date: new Date(),
              //     };
              //     console.log(orderObject);

              //     db.get()
              //       .collection(orderCollection)
              //       .insertOne(orderObject)
              //       .then((response) => {
              //         resolve(response.ops[0]._id);

              //         db.get()
              //           .collection(bookingCollection)
              //           .removeOne({ userid: ObjectId(userbooking.userid) });
              //         for (
              //           let index = 0;
              //           index < products.booking.length;
              //           index++
              //         ) {
              //           const roomid = products.booking[index].roomid;
              //           console.log("roomid auto call", roomid);
              //           db.get()
              //             .collection(roomCollection)
              //             .updateOne(
              //               {
              //                 _id: ObjectId(roomid),
              //               },
              //               {
              //                 $set: {
              //                   booking: true,
              //                 },
              //               }
              //             );
              //           console.log(roomid + "updated");
              //         }
              //         console.log("Order placed");
              //       });
              //   } else {
              //     console.log("no booking found in the cart");
              //   }
              // });
              resolve();
              // roomid = [];
              // booking = [];
            });
        }
      }
    });
  },
  generaterazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("new order", order);
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (data, booking, id) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "aijrQJALtn6kCNXtUADXi8hw");

      hmac.update(
        data["payment[razorpay_order_id]"] +
          "|" +
          data["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == data["payment[razorpay_signature]"]) {
        resolve();
        db.get()
          .collection(bookingCollection)
          .removeOne({ userid: ObjectId(id) });
        for (let index = 0; index < booking.length; index++) {
          const roomid = booking[index].roomid;
          console.log(roomid);
          db.get()
            .collection(roomCollection)
            .updateOne(
              {
                _id: ObjectId(roomid),
              },
              {
                $set: {
                  booking: true,
                },
              }
            );
          console.log(roomid + "updated");
        }
      } else {
        reject();
      }
    });
  },
  changeStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(orderCollection)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  useroombooking: (id) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(bookingCollection)
        .findOne({ userid: ObjectId(id) });

      resolve(orders.booking);
    });
  },
  placeOrder: (order, products, total, id) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order.payment === "COD" ? "placed" : "pending";
      let orderObject = {
        deliveryDetails: {
          mobile: order.mobile,
        },
        userId: ObjectId(id),
        paymentMethod: order.payment,
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };

      db.get()
        .collection(orderCollection)
        .insertOne(orderObject)
        .then((response) => {
          resolve(response.ops[0]._id);
          if (order.payment === "COD") {
            db.get()
              .collection(bookingCollection)
              .removeOne({ userid: ObjectId(id) });
            for (let index = 0; index < products.length; index++) {
              const roomid = products[index].roomid;
              console.log(roomid);
              db.get()
                .collection(roomCollection)
                .updateOne(
                  {
                    _id: ObjectId(roomid),
                  },
                  {
                    $set: {
                      booking: true,
                    },
                  }
                );
              console.log(roomid + "updated");
            }
          }
        });
    });
  },
  finedetails: (id) => {
    return new Promise(async (resolve, reject) => {
      let details = await db
        .get()
        .collection(fineCollection)
        .aggregate([{ $match: { userid: ObjectId(id), status: "not paid" } }])
        .toArray();
      console.log(details);
      resolve(details);
    });
  },
  fineplaceOrder: (data, id) => {
    return new Promise((resolve, reject) => {
      let fineObject = {
        userid: ObjectId(id),
        details: data,
      };
      db.get()
        .collection(finepaymentCollection)
        .insertOne(fineObject)
        .then((response) => {
          resolve(response.ops[0]._id);
        });
    });
  },
  finegeneraterazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("new order", order);
          resolve(order);
        }
      });
    });
  },
  fineverifyPayment: async (data, id) => {
    return new Promise((resolve, reject) => {
      // console.log(id);
      console.log("fineverifyPayment");
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "aijrQJALtn6kCNXtUADXi8hw");

      hmac.update(
        data["payment[razorpay_order_id]"] +
          "|" +
          data["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == data["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changeFineStatus: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(fineCollection)
        .updateOne(
          {
            roomid: ObjectId(id),
          },
          {
            $set: {
              status: "paid",
            },
          }
        );
      resolve();
    });
  },
};
