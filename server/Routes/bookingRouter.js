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
bookingRouter.post("/book", userAuth, async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    // Before booking check availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }
    // get totalPrice from Room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    // Calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    totalPrice *= nights;
    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    const mailOptions = {
      from: `"StayEase" <${process.env.SENDER_EMAIL}>`,
      to: req.user.email,
      subject: "Hotel Booking Details",
      html: `
    <h2>Your Booking Details</h2>
    <p>Dear ${req.user.username},</p>
    <p>Thank you for your booking! Here are your details:</p>
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
      <li><strong>Location:</strong> ${roomData.hotel.address}</li>
      <li><strong>Date:</strong> ${booking.checkInDate.toDateString()}</li>
      <li><strong>Booking Amount:</strong> ${process.env.CURRENCY || "$"}${
        booking.totalPrice
      } /night</li>
    </ul>
    <p>We look forward to welcoming you!</p>
    <p>If you need to make any changes, feel free to contact us.</p>
  `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    res.json({ success: false, message: "Failed to create booking" });
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
