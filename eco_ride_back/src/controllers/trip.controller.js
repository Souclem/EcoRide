const TripServices = require("../services/trip.services");

const TripController = {
    /**
     * Créer un nouveau trajet
     */
    async createTrip(req, res) {
        try {
            const tripData = req.body;
            const driverId = req.userId; // Récupéré du middleware auth

            console.log("📝 Création d'un nouveau trajet:", tripData);

            const trip = await TripServices.createTrip(tripData, driverId);

            return res.status(201).json({
                message: "Trajet créé avec succès",
                trip
            });
        } catch (err) {
            console.error("❌ Erreur création trajet:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Récupérer tous les trajets disponibles avec filtres optionnels
     * Query params:
     *   - Recherche géographique: startLat, startLng, endLat, endLng, radius (optionnel, défaut 50km)
     *   - Recherche textuelle: startAddress, endAddress
     *   - Dates: startDate, endDate
     */
    async getAvailableTrips(req, res) {
        try {
            const filters = {
                // Recherche géographique (prioritaire)
                startLat: req.query.startLat,
                startLng: req.query.startLng,
                endLat: req.query.endLat,
                endLng: req.query.endLng,
                radius: req.query.radius ? parseFloat(req.query.radius) : undefined,

                // Recherche textuelle (fallback)
                startAddress: req.query.startAddress,
                endAddress: req.query.endAddress,

                // Filtres de date
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            console.log("🔍 Recherche de trajets avec filtres:", filters);

            const trips = await TripServices.getAvailableTrips(filters);
            return res.json({ trips });
        } catch (err) {
            console.error("❌ Erreur récupération trajets:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Récupérer un trajet par ID
     */
    async getTripById(req, res) {
        try {
            const { id } = req.params;
            const trip = await TripServices.getTripById(id);
            return res.json({ trip });
        } catch (err) {
            if (err.message === "TRIP_NOT_FOUND") {
                return res.status(404).json({ message: "Trajet non trouvé" });
            }
            console.error("❌ Erreur récupération trajet:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Calculer la distance et le prix suggéré entre deux points
     * Query params: startLat, startLng, endLat, endLng
     */
    calculateEstimate(req, res) {
        try {
            const { startLat, startLng, endLat, endLng } = req.query;

            // Validation
            if (!startLat || !startLng || !endLat || !endLng) {
                return res.status(400).json({
                    message: "Paramètres manquants: startLat, startLng, endLat, endLng requis"
                });
            }

            const estimate = TripServices.calculateTripEstimate(
                parseFloat(startLat),
                parseFloat(startLng),
                parseFloat(endLat),
                parseFloat(endLng)
            );

            return res.json(estimate);
        } catch (err) {
            console.error("❌ Erreur calcul estimation:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Récupérer tous les trajets d'un utilisateur (conducteur + passager)
     */
    async getMyTrips(req, res) {
        try {
            const userId = req.userId; // Récupéré du middleware auth

            console.log("📋 Récupération trajets utilisateur:", userId);

            const trips = await TripServices.getUserTrips(userId);

            return res.json(trips);
        } catch (err) {
            console.error("❌ Erreur récupération trajets:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    }
};

module.exports = TripController;
