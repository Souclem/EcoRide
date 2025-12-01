const express = require("express");
const TripController = require("../controllers/trip.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Routes publiques
router.get("/", TripController.getAvailableTrips);
router.get("/estimate", TripController.calculateEstimate);

// Routes protégées (nécessitent authentification)
router.get("/my/trips", auth, TripController.getMyTrips);
router.post("/", auth, TripController.createTrip);

// Routes publiques (après les routes spécifiques)
router.get("/:id", TripController.getTripById);

module.exports = router;
