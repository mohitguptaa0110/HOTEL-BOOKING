const stripe = require("stripe");
const Booking = require("../models/Booking");

const stripeWebhooks = async (req, res) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const bookingId = session.metadata.bookingId;

    try {
      await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        paymentMethod: "Stripe",
      });
      console.log("✅ Booking marked as paid");
    } catch (error) {
      console.error("❌ Failed to update booking:", error.message);
    }
  } else {
    console.log("Unhandled event type:", event.type);
  }
  res.json({ received: true });
};

module.exports = stripeWebhooks;
