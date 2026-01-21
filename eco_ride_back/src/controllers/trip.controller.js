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

            const errors = [];

            // 1. Validation des champs requis
            if (!tripData.start_address || tripData.start_address.trim() === '') {
                errors.push("L'adresse de départ est obligatoire");
            }

            if (!tripData.end_address || tripData.end_address.trim() === '') {
                errors.push("L'adresse d'arrivée est obligatoire");
            }

            if (!tripData.distance_km) {
                errors.push("La distance du trajet est requise");
            }

            // 2. Validation des coordonnées GPS
            const startLat = parseFloat(tripData.start_latitude);
            const startLng = parseFloat(tripData.start_longitude);
            const endLat = parseFloat(tripData.end_latitude);
            const endLng = parseFloat(tripData.end_longitude);

            if (isNaN(startLat) || startLat < -90 || startLat > 90) {
                errors.push("Latitude de départ invalide (doit être entre -90 et 90)");
            }
            if (isNaN(startLng) || startLng < -180 || startLng > 180) {
                errors.push("Longitude de départ invalide (doit être entre -180 et 180)");
            }
            if (isNaN(endLat) || endLat < -90 || endLat > 90) {
                errors.push("Latitude d'arrivée invalide (doit être entre -90 et 90)");
            }
            if (isNaN(endLng) || endLng < -180 || endLng > 180) {
                errors.push("Longitude d'arrivée invalide (doit être entre -180 et 180)");
            }
            // 3. Validation de la date
            if (!tripData.start_date) {
                errors.push("La date de départ est obligatoire");
            } else {
                const startDate = new Date(tripData.start_date);
                const now = new Date();

                if (isNaN(startDate.getTime())) {
                    errors.push("Format de date invalide");
                } else if (startDate < now) {
                    errors.push("La date de départ doit être dans le futur");
                }
            }

            // 4. Validation de la distance
            const distanceKm = parseFloat(tripData.distance_km);

            if (isNaN(distanceKm)) {
                errors.push("La distance doit être un nombre");
            } else if (distanceKm < 0.1) {
                errors.push("La distance doit être supérieure à 0.1 km");
            } else if (distanceKm > 2000) {
                errors.push("La distance ne peut pas dépasser 2000 km");
            }

            // 5. Validation du prix
            const pricePerSeat = parseInt(tripData.price_per_seat);

            if (isNaN(pricePerSeat)) {
                errors.push("Le prix par siège doit être un nombre");
            } else if (pricePerSeat < 1) {
                errors.push("Le prix par siège doit être supérieur à 0€");
            } else if (pricePerSeat > 500) {
                errors.push("Le prix par siège ne peut pas dépasser 500€");
            }

            // 6. Validation du nombre de places
            const totalSeats = parseInt(tripData.total_seats);

            if (isNaN(totalSeats)) {
                errors.push("Le nombre de places doit être un nombre");
            } else if (totalSeats < 1) {
                errors.push("Le nombre de places doit être supérieur à 0");
            } else if (totalSeats > 8) {
                errors.push("Le nombre de places ne peut pas dépasser 8");
            }

            // Retourner les erreurs s'il y en a
            if (errors.length > 0) {
                return res.status(400).json({
                    message: "Validation échouée",
                    errors: errors
                });
            }

            // ===========================
            // Toutes les validations OK → Créer le trajet
            // ===========================

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
     * Récupérer tous les trajets disponibles
     * Query params:
     *   - status: 'available' (défaut) ou 'all' (admin uniquement)
     */
    async getAvailableTrips(req, res) {
        try {
            const status = req.query.status || 'available';

            console.log("🔍 Recherche de trajets avec statut:", status);

            const trips = await TripServices.getAvailableTrips(status);
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
     * Route publique mais inclut les passagers si utilisateur autorisé
     */
    async getTripById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId || null; // Si connecté
            const userRole = req.user?.role || null; // Si connecté

            const trip = await TripServices.getTripById(id, userId, userRole);
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
     * Récupérer tous les trajets d'un utilisateur (conducteur + passager)
     * Query param optionnel: userId (admin uniquement)
     */
    async getMyTrips(req, res) {
        try {
            const requestingUserId = req.userId; // Utilisateur qui fait la demande
            const userRole = req.user?.role;
            const targetUserId = req.query.userId ? parseInt(req.query.userId) : null; // Si admin veut voir les trips d'un autre user

            console.log("📋 Récupération trajets utilisateur:", targetUserId || requestingUserId);

            const trips = await TripServices.getUserTrips(requestingUserId, targetUserId, userRole);

            return res.json(trips);
        } catch (err) {
            if (err.message.includes("pas autorisé")) {
                return res.status(403).json({ message: err.message });
            }
            console.error("❌ Erreur récupération trajets:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Calculer le prix d'un trajet avec promotions et abonnements
     * Query params: tripId, seatsBooked
     */
    async calculateTripPricing(req, res) {
        try {
            const { tripId, seatsBooked } = req.query;
            const userId = req.userId; // Récupéré du middleware auth

            if (!tripId || !seatsBooked) {
                return res.status(400).json({
                    message: "Paramètres manquants: tripId et seatsBooked requis"
                });
            }

            const result = await TripServices.calculateTripPricing(tripId, userId, seatsBooked);
            return res.json(result);
        } catch (err) {
            if (err.message === "Trajet introuvable") {
                return res.status(404).json({ message: err.message });
            }
            console.error("❌ Erreur calcul pricing:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Ouvrir un trajet (conducteur uniquement)
     * POST /api/trips/:id/open
     */
    async openTrip(req, res) {
        try {
            const { id } = req.params;
            const { latitude, longitude } = req.body;
            const driverId = req.userId; // Récupéré du middleware auth

            if (!latitude || !longitude) {
                return res.status(400).json({
                    error: "Position GPS requise (latitude et longitude)"
                });
            }

            const result = await TripServices.openTrip(id, driverId, latitude, longitude);
            return res.json(result);
        } catch (err) {
            console.error("❌ Erreur ouverture trajet:", err);
            return res.status(400).json({
                error: err.message
            });
        }
    },

    /**
     * Démarrer un trajet (conducteur uniquement)
     * POST /api/trips/:id/start
     */
    async startTrip(req, res) {
        try {
            const { id } = req.params;
            const driverId = req.userId; // Récupéré du middleware auth

            const result = await TripServices.startTrip(id, driverId);
            return res.json(result);
        } catch (err) {
            console.error("❌ Erreur démarrage trajet:", err);
            return res.status(400).json({
                error: err.message
            });
        }
    },

    /**
     * Terminer un trajet (conducteur uniquement)
     * POST /api/trips/:id/complete
     */
    async completeTrip(req, res) {
        try {
            const { id } = req.params;
            const { latitude, longitude } = req.body;
            const driverId = req.userId; // Récupéré du middleware auth

            if (!latitude || !longitude) {
                return res.status(400).json({
                    error: "Position GPS requise (latitude et longitude)"
                });
            }

            const result = await TripServices.completeTrip(id, driverId, latitude, longitude);
            return res.json(result);
        } catch (err) {
            console.error("❌ Erreur fin trajet:", err);
            return res.status(400).json({
                error: err.message
            });
        }
    },

    /**
     * Mettre à jour un trajet
     * PUT /api/trips/:id
     * Accessible par: Conducteur propriétaire + Admin
     */
    async updateTrip(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const userRole = req.user?.role;
            const updates = req.body;

            const result = await TripServices.updateTrip(id, userId, userRole, updates);
            return res.json(result);
        } catch (err) {
            if (err.message === "Trajet introuvable") {
                return res.status(404).json({ message: err.message });
            }
            if (err.message.includes("pas autorisé")) {
                return res.status(403).json({ message: err.message });
            }
            if (err.message === "Aucun champ à modifier") {
                return res.status(400).json({ message: err.message });
            }
            console.error("❌ Erreur mise à jour trajet:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Supprimer un trajet
     * DELETE /api/trips/:id
     * Accessible par: Conducteur propriétaire + Admin
     */
    async deleteTrip(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const userRole = req.user?.role;

            const result = await TripServices.deleteTrip(id, userId, userRole);
            return res.json(result);
        } catch (err) {
            if (err.message === "Trajet introuvable") {
                return res.status(404).json({ message: err.message });
            }
            if (err.message.includes("pas autorisé")) {
                return res.status(403).json({ message: err.message });
            }
            if (err.message.includes("Impossible de supprimer")) {
                return res.status(400).json({ message: err.message });
            }
            console.error("❌ Erreur suppression trajet:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    }
};

module.exports = TripController;
