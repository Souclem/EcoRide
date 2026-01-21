const express = require("express");
const GeocodingController = require("../controllers/geocoding.controller");

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

/**
 * @route   GET /api/geocoding/search
 * @desc    Rechercher des adresses (geocoding)
 * @access  Public
 */
router.get("/search", GeocodingController.searchAddress);

/**
 * @route   GET /api/geocoding/reverse
 * @desc    Géocodage inversé (coordonnées → adresse)
 * @access  Public
 */
router.get("/reverse", GeocodingController.reverseGeocode);

/**
 * @route   GET /api/geocoding/route
 * @desc    Calculer l'itinéraire routier entre deux points
 * @access  Public
 */
router.get("/route", GeocodingController.getRoute);

module.exports = router;
