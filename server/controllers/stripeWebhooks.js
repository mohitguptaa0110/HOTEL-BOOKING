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
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;

    // Getting session metadata
    const session = await stripeInstance.checkout.session.list({
      payment_intent: paymentIntentId,
    })

    const {bookingId} =session.data[0].metadata;
    // Mark payment as paid
    await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        paymentMethod: "Stripe",
      });
  } else {
    console.log("Unhandled event type:", event.type);
  }
  res.json({ received: true });
};

module.exports = stripeWebhooks;
