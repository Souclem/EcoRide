const GeocodingServices = require("../services/geocoding.services");

const GeocodingController = {
    /**
     * Rechercher des adresses
     * Query params: q (query), limit (optionnel)
     */
    async searchAddress(req, res) {
        try {
            const { q, limit } = req.query;

            if (!q) {
                return res.status(400).json({
                    message: "Paramètre 'q' (query) requis"
                });
            }

            const results = await GeocodingServices.searchAddress(q, limit);
            return res.json(results);
        } catch (err) {
            console.error("❌ Erreur recherche adresse:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Géocodage inversé (coordonnées → adresse)
     * Query params: lat, lng
     */
    async reverseGeocode(req, res) {
        try {
            const { lat, lng } = req.query;

            if (!lat || !lng) {
                return res.status(400).json({
                    message: "Paramètres 'lat' et 'lng' requis"
                });
            }

            const result = await GeocodingServices.reverseGeocode(
                parseFloat(lat),
                parseFloat(lng)
            );
            return res.json(result);
        } catch (err) {
            console.error("❌ Erreur reverse geocoding:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    },

    /**
     * Calculer un itinéraire routier entre deux points
     * Query params: startLat, startLng, endLat, endLng
     */
    async getRoute(req, res) {
        try {
            const { startLat, startLng, endLat, endLng } = req.query;

            if (!startLat || !startLng || !endLat || !endLng) {
                return res.status(400).json({
                    message: "Paramètres 'startLat', 'startLng', 'endLat', 'endLng' requis"
                });
            }

            const result = await GeocodingServices.getRoute(
                parseFloat(startLng),
                parseFloat(startLat),
                parseFloat(endLng),
                parseFloat(endLat)
            );
            return res.json(result);
        } catch (err) {
            console.error("❌ Erreur calcul itinéraire:", err);
            return res.status(500).json({
                message: "Erreur serveur: " + err.message
            });
        }
    }
};

module.exports = GeocodingController;
