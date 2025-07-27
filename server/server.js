const express = require("express");
require("dotenv/config");
const cors = require("cors");
const connectDB = require("./configs/database");
const { clerkMiddleware } = require("@clerk/express");
const clerkWebhooks = require("./controllers/clerkWebhooks");
const connectCloudinary = require("./configs/cloudinary");
const stripeWebhooks = require("./controllers/stripeWebhooks");

const app = express();
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://your-frontend-domain.vercel.app",
//     ],
//     credentials: true,
//   })
// ); // Enable Cross-Origin Resource Sharing
app.use(cors()); // Enable Cross-Origin Resource Sharing

// API to listen to stripe WebHooks
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }), // <-- required for signature
  stripeWebhooks
);

app.use(express.json());
app.use(clerkMiddleware());

// API to listen to Clerk Webhooks
app.post("/clerk", clerkWebhooks);

app.get("/", (req, res) => res.send("API is working"));

const userRouter = require("./Routes/userRoute");
const hotelRouter = require("./Routes/hotelRoute");
const roomRouter = require("./Routes/roomRoute");
const bookingRouter = require("./Routes/bookingRouter");

app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

connectDB()
  .then(() => {
    connectCloudinary();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
  });
