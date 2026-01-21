const axios = require("axios");

const GeocodingServices = {
    /**
     * Rechercher des adresses (geocoding)
     * @param {string} query - Adresse à rechercher
     * @param {number} limit - Nombre de résultats (défaut: 5)
     * @returns {Promise<Array>} Liste de résultats
     */
    async searchAddress(query, limit = 5) {
        try {
            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: query,
                        format: "json",
                        limit: limit,
                        countrycodes: "fr,be,lu,ch"
                    },
                    headers: {
                        "User-Agent": "EcoRide App"
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error("❌ Erreur geocoding:", error);
            throw new Error("GEOCODING_ERROR");
        }
    },

    /**
     * Géocodage inversé (coordonnées → adresse)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<Object>} Adresse trouvée
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await axios.get(
                "https://nominatim.openstreetmap.org/reverse",
                {
                    params: {
                        lat: lat,
                        lon: lng,
                        format: "json"
                    },
                    headers: {
                        "User-Agent": "EcoRide App"
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error("❌ Erreur reverse geocoding:", error);
            throw new Error("REVERSE_GEOCODING_ERROR");
        }
    },

    /**
     * Calculer un itinéraire routier entre deux points
     * Utilise OSRM (Open Source Routing Machine)
     * @param {number} startLng - Longitude de départ
     * @param {number} startLat - Latitude de départ
     * @param {number} endLng - Longitude d'arrivée
     * @param {number} endLat - Latitude d'arrivée
     * @returns {Promise<Object>} Itinéraire avec coordonnées et distance
     */
    async getRoute(startLng, startLat, endLng, endLat) {
        try {
            // OSRM utilise le format: lng,lat (inversé par rapport à Leaflet)
            const response = await axios.get(
                `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}`,
                {
                    params: {
                        overview: "full",
                        geometries: "geojson"
                    }
                }
            );

            if (response.data.code !== "Ok") {
                throw new Error("ROUTING_ERROR");
            }

            const route = response.data.routes[0];
            return {
                coordinates: route.geometry.coordinates, // Array de [lng, lat]
                distance: route.distance / 1000, // Convertir en km
                duration: route.duration / 60 // Convertir en minutes
            };
        } catch (error) {
            console.error("❌ Erreur calcul itinéraire:", error);
            throw new Error("ROUTING_ERROR");
        }
    }
};

module.exports = GeocodingServices;
