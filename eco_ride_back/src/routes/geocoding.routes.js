const express = require("express");
const GeocodingController = require("../controllers/geocoding.controller");

const router = express.Router();

// Routes publiques
router.get("/search", GeocodingController.searchAddress);
router.get("/reverse", GeocodingController.reverseGeocode);
router.get("/route", GeocodingController.getRoute);

module.exports = router;
