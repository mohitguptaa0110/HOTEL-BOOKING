const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Connected");
    });

    await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err; // to be caught in server.js
  }
};

module.exports = connectDB;
