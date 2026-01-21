const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const tripRoutes = require("./routes/trip.routes");
const geocodingRoutes = require("./routes/geocoding.routes");
const bookingRoutes = require("./routes/booking.routes");
const promotionRoutes = require("./routes/promotion.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const settingsRoutes = require("./routes/settings.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "EcoRide API OK" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/geocoding", geocodingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);

module.exports = app;
