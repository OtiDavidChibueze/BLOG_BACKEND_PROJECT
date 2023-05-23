const mongoose = require("mongoose");
const { DB_CONNECTION } = require("../config/keys");

const connectToDatabase = () => {
  try {
    mongoose.connect(DB_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("database connected");
  } catch (error) {
    console.log({ message: "database nit connected ", error });
  }
};

module.exports = connectToDatabase;
