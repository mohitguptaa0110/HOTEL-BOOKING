const express = require("express");
const { checkAvailability } = require("../utils/checkAvailability");
const { userAuth } = require("../middleware/auth");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const { messageInRaw } = require("svix");
const Hotel = require("../models/Hotel");
const transporter = require("../configs/nodemailer");
const bookingRouter = express.Router();
const stripe = require("stripe");

//Api to check availability of room
bookingRouter.post("/check-availability", async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Api to create a new booking
const mongoose = require("mongoose");

bookingRouter.post("/book", userAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    // 🔒 STEP 1: Check availability INSIDE transaction
    const conflictingBookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    }).session(session);

    if (conflictingBookings.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ success: false, message: "Room is not available" });
    }

    // 🔒 STEP 2: Get room data INSIDE transaction
    const roomData = await Room.findById(room)
      .populate("hotel")
      .session(session);

    let totalPrice = roomData.pricePerNight;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)
    );

    totalPrice *= nights;

    // 🔒 STEP 3: Create booking INSIDE transaction
    const booking = await Booking.create(
      [
        {
          user,
          room,
          hotel: roomData.hotel._id,
          guests: +guests,
          checkInDate,
          checkOutDate,
          totalPrice,
        },
      ],
      { session }
    );

    // ✅ STEP 4: Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 📧 Send email AFTER commit (important)
    const mailOptions = {
      from: `"StayEase" <${process.env.SENDER_EMAIL}>`,
      to: req.user.email,
      subject: "Hotel Booking Details",
      html: `
        <h2>Your Booking Details</h2>
        <p>Dear ${req.user.username},</p>
        <p>Thank you for your booking!</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking[0]._id}</li>
          <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
          <li><strong>Date:</strong> ${new Date(checkInDate).toDateString()}</li>
          <li><strong>Amount:</strong> ${totalPrice}</li>
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Booking successful" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.json({ success: false, message: "Booking failed" });
  }
});

// Api to get all bookings of a user
bookingRouter.get("/user", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to create booking" });
  }
});

// Api for hotel owners to get all bookings of a hotel
bookingRouter.get("/hotel", userAuth, async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });

    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    // Total Bookings
    const totalBookings = bookings.length;

    // Total Revenue
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0
    );

    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// Api to integrate stripe payment gateway
bookingRouter.post("/stripe-payment", userAuth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    const roomData = await Room.findById(booking.room).populate("hotel");
    const totalPrice = booking.totalPrice;
    const { origin } = req.headers;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      metadata: {
         bookingId: bookingId.toString(),
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.json({ success: false, message: "Payment Failed" });
  }
});
module.exports = bookingRouter;
