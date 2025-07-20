const { Webhook, messageInRaw } = require("svix");
const User = require("../models/User");

const clerkWebhooks = async (req, res) => {
  try {
    // Create a Svix instance with the Clerk webhook secret
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Get the Svix headers from the request
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify and parse the webhook payload
    await whook.verify(JSON.stringify(req.body), headers);

    console.log("Webhook triggered:", req.body.type);

    // Getting data from request body
    const { data, type } = req.body;
    console.log("Webhook received with type:", type);
    console.log("Data payload:", data);

    const userData = {
      clerkId: data.id,
      email: data.email_addresses[0].email_address,
      username: data.first_name + " " + data.last_name,
      image: data.image_url,
    };

    // Switch cases for different events
    switch (type) {
      case "user.created": {
        await User.create(userData);
        break;
      }
      case "user.updated": {
        await User.findByIdAndUpdate({ clerkId: data.id }, userData);
        break;
      }
      case "user.deleted": {
        await User.findByIdAndDelete({ clerkId: data.id });
        break;
      }
      default:
        break;
    }
    res.status(200).json({ success: true, message: "Webhook Received" });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = clerkWebhooks;
