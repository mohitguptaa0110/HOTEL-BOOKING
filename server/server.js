const express = require("express");
require("dotenv/config");
const cors = require("cors");
const connectDB = require("./configs/database");
const { clerkMiddleware } = require("@clerk/express");
const clerkWebhooks = require("./controllers/clerkWebhooks");

const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json());
app.use(clerkMiddleware());

// API to listen to Clerk Webhooks
app.use("/api/clerk", clerkWebhooks)

app.get('/', (req, res) => res.send("API is working"));

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
  });
