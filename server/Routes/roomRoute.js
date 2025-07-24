const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { userAuth } = require("../middleware/auth");
const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const roomRouter = express.Router();
const cloudinary = require("cloudinary").v2;

// API to create a new room for a hotel
roomRouter.post("/", upload.array("images", 4), userAuth, async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities } = req.body;

    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) return res.json({ success: false, message: "No Hotel found" });

    // Upload images to Cloudinary
    const uploadImages = req.files.map(async (file) => {
      const response = await cloudinary.uploader.upload(file.path);
      return response.secure_url;
    });

    const images = await Promise.all(uploadImages);

    // Save room in DB
    await Room.create({
      hotel: hotel._id,
      roomType,
      pricePerNight: +pricePerNight,
      amenities: JSON.parse(amenities),
      images,
    });

    res.json({ success: true, message: "Room created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API to get all the available room
roomRouter.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true }) // get only available rooms
      .populate({
        path: "hotel", // join with hotel collection
        populate: {
          path: "owner", // join hotel.owner
          select: "image", // get only owner's image
        },
      })
      .sort({ createdAt: -1 }); // newest rooms first

    res.json({ success: true, rooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API to get all the room of a specific hotel
roomRouter.get("/owner", userAuth, async (req, res) => {
  try {
    const hotelData = await Hotel.findOne({ owner: req.auth.userId }); // find hotel by owner ID

    const rooms = await Room.find({ hotel: hotelData._id.toString() }) // get rooms of that hotel
      .populate("hotel"); // optional: show hotel details

    res.json({ success: true, rooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API to toggle availabilty of a room
roomRouter.post("/toggle-availability", userAuth, async (req, res) => {
  try {
    const { roomId } = req.body;

    const roomData = await Room.findById(roomId);
    if (!roomData) {
      return res.json({ success: false, message: "Room not found" });
    }

    roomData.isAvailable = !roomData.isAvailable;
    await roomData.save();

    res.json({ success: true, message: "Room availability updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});
module.exports = roomRouter;
