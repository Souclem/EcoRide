const express = require("express");
const TripController = require("../controllers/trip.controller");
const { auth } = require("../middleware/auth.middleware");

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

/**
 * @route   GET /api/trips
 * @desc    Récupérer tous les trajets disponibles avec filtres
 * @access  Public
 */
router.get("/", TripController.getAvailableTrips);

// ==================== ROUTES PROTÉGÉES ====================

/**
 * @route   GET /api/trips/my/trips
 * @desc    Récupérer tous les trajets de l'utilisateur connecté (conducteur + passager)
 * @access  Privé
 */
router.get("/my/trips", auth, TripController.getMyTrips);

/**
 * @route   GET /api/trips/pricing
 * @desc    Calculer le prix d'un trajet avec promotions et abonnements
 * @access  Privé
 */
router.get("/pricing", auth, TripController.calculateTripPricing);

/**
 * @route   POST /api/trips
 * @desc    Créer un nouveau trajet
 * @access  Privé
 */
router.post("/", auth, TripController.createTrip);

/**
 * @route   POST /api/trips/:id/open
 * @desc    Ouvrir un trajet (conducteur uniquement)
 * @access  Privé
 */
router.post("/:id/open", auth, TripController.openTrip);

/**
 * @route   POST /api/trips/:id/start
 * @desc    Démarrer un trajet (conducteur uniquement)
 * @access  Privé
 */
router.post("/:id/start", auth, TripController.startTrip);

/**
 * @route   POST /api/trips/:id/complete
 * @desc    Terminer un trajet (conducteur uniquement)
 * @access  Privé
 */
router.post("/:id/complete", auth, TripController.completeTrip);

/**
 * @route   PUT /api/trips/:id
 * @desc    Modifier un trajet (conducteur propriétaire + admin)
 * @access  Privé
 */
router.put("/:id", auth, TripController.updateTrip);

/**
 * @route   DELETE /api/trips/:id
 * @desc    Supprimer un trajet (conducteur propriétaire + admin)
 * @access  Privé
 */
router.delete("/:id", auth, TripController.deleteTrip);

// ==================== ROUTES PUBLIQUES (ID spécifique en dernier) ====================

/**
 * @route   GET /api/trips/:id
 * @desc    Récupérer un trajet par son ID
 * @access  Public
 */
router.get("/:id", TripController.getTripById);

module.exports = router;
