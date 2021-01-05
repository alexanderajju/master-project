const mongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};

module.exports.connect = (done) => {
  // const url = "mongodb://localhost:27017";
  const url =
    "mongodb+srv://aju:aju@cluster0.8lkau.mongodb.net/test?retryWrites=true&w=majority";
  const dbname = "test";

  mongoClient.connect(url, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  });
};

module.exports.get = function () {
  return state.db;
};
