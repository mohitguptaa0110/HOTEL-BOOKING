const express = require("express");
const { userAuth } = require("../middleware/auth");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const hotelRouter = express.Router();

hotelRouter.post("/", userAuth, async (req, res) => {
  try {
    const { name, address, contact, city } = req.body;
    const owner = req.user._id;

    // Check if User Already Registered a Hotel
    const hotel = await Hotel.findOne({ owner });
    if (hotel) {
      return res.json({ success: false, message: "Hotel Already Registered" });
    }

    // Create New Hotel
    await Hotel.create({ name, address, contact, city, owner });

    // Update User Role
    await User.findByIdAndUpdate(owner, { role: "hotelOwner" });

    res.json({ success: true, message: "Hotel Registered Successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
});

module.exports = hotelRouter;
