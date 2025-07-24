const express = require("express");
const { userAuth } = require("../middleware/auth");

const userRouter = express.Router();

userRouter.get("/", userAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const recentSearchedCities = req.user.recentSearchedCities;

    res.json({ success: true, role, recentSearchedCities });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

userRouter.post("/store-recent-search", userAuth, async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = req.user;

    if (user.recentSearchedCities.length < 3) {
      user.recentSearchedCities.push(recentSearchedCity);
    } else {
      user.recentSearchedCities.shift();
      user.recentSearchedCities.push(recentSearchedCity);
    }

    await user.save();
    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = userRouter;
