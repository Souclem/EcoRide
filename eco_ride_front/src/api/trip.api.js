import axios from "./axios";

/**
 * Récupérer tous les trajets disponibles avec filtres optionnels
 * @param {Object} filters - Filtres de recherche
 * @returns {Promise}
 */
export function getAvailableTrips(filters = {}) {
  return axios.get("/trips", { params: filters });
}

/**
 * Récupérer un trajet par ID
 * @param {number} id - ID du trajet
 * @returns {Promise}
 */
export function getTripById(id) {
  return axios.get(`/trips/${id}`);
}

/**
 * Créer un nouveau trajet
 * @param {Object} tripData - Données du trajet
 * @returns {Promise}
 */
export function createTrip(tripData) {
  return axios.post("/trips", tripData);
}

/**
 * Calculer la distance et le prix suggéré entre deux points
 * @param {number} startLat - Latitude de départ
 * @param {number} startLng - Longitude de départ
 * @param {number} endLat - Latitude d'arrivée
 * @param {number} endLng - Longitude d'arrivée
 * @returns {Promise}
 */
export function calculateEstimate(startLat, startLng, endLat, endLng) {
  return axios.get("/trips/estimate", {
    params: { startLat, startLng, endLat, endLng }
  });
}

/**
 * Rechercher des adresses (geocoding)
 * @param {string} query - Adresse à rechercher
 * @param {number} limit - Nombre de résultats
 * @returns {Promise}
 */
export function searchAddress(query, limit = 5) {
  return axios.get("/geocoding/search", {
    params: { q: query, limit }
  });
}

/**
 * Géocodage inversé (coordonnées → adresse)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise}
 */
export function reverseGeocode(lat, lng) {
  return axios.get("/geocoding/reverse", {
    params: { lat, lng }
  });
}

/**
 * Calculer l'itinéraire routier entre deux points
 * @param {number} startLat - Latitude de départ
 * @param {number} startLng - Longitude de départ
 * @param {number} endLat - Latitude d'arrivée
 * @param {number} endLng - Longitude d'arrivée
 * @returns {Promise}
 */
export function getRoute(startLat, startLng, endLat, endLng) {
  return axios.get("/geocoding/route", {
    params: { startLat, startLng, endLat, endLng }
  });
}

/**
 * Récupérer tous les trajets de l'utilisateur connecté
 * (conducteur + passager, catégorisés en ongoing, upcoming, past)
 * @returns {Promise}
 */
export function getMyTrips() {
  return axios.get("/trips/my/trips");
}

/**
 * Calculer le prix d'un trajet avec promotions et abonnements
 * @param {number} tripId - ID du trajet
 * @param {number} seatsBooked - Nombre de places à réserver
 * @returns {Promise}
 */
export function calculateTripPricing(tripId, seatsBooked = 1) {
  return axios.get("/trips/pricing", {
    params: { tripId, seatsBooked }
  });
}

/**
 * Ouvrir un trajet (conducteur uniquement)
 * @param {number} tripId - ID du trajet
 * @param {number} latitude - Latitude actuelle du conducteur
 * @param {number} longitude - Longitude actuelle du conducteur
 * @returns {Promise}
 */
export function openTrip(tripId, latitude, longitude) {
  return axios.post(`/trips/${tripId}/open`, { latitude, longitude });
}

/**
 * Démarrer un trajet (conducteur uniquement)
 * @param {number} tripId - ID du trajet
 * @returns {Promise}
 */
export function startTrip(tripId) {
  return axios.post(`/trips/${tripId}/start`);
}

/**
 * Terminer un trajet (conducteur uniquement)
 * @param {number} tripId - ID du trajet
 * @param {number} latitude - Latitude actuelle du conducteur
 * @param {number} longitude - Longitude actuelle du conducteur
 * @returns {Promise}
 */
export function completeTrip(tripId, latitude, longitude) {
  return axios.post(`/trips/${tripId}/complete`, { latitude, longitude });
}

// ==================== ADMIN ONLY ====================

/**
 * Récupérer tous les trajets (ADMIN peut voir tous les statuts)
 * @param {Object} filters - Filtres optionnels (status, startDate, endDate, etc.)
 * @returns {Promise}
 */
export function getAllTrips(filters = {}) {
  return axios.get('/trips', { params: filters });
}

/**
 * Mettre à jour un trajet (ADMIN peut modifier tous les champs)
 * @param {number} tripId - ID du trajet
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise}
 */
export function updateTrip(tripId, updates) {
  return axios.put(`/trips/${tripId}`, updates);
}

/**
 * Supprimer un trajet (ADMIN uniquement)
 * @param {number} tripId - ID du trajet
 * @returns {Promise}
 */
export function deleteTrip(tripId) {
  return axios.delete(`/trips/${tripId}`);
}
