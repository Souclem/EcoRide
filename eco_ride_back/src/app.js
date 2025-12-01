const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
const geocodingRoutes = require("./routes/geocoding.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "EcoRide API OK" }));

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/geocoding", geocodingRoutes);

module.exports = app;
