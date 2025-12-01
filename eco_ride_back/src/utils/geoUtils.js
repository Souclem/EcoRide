/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @returns {number} Distance en kilomètres
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arrondi à 2 décimales
}

/**
 * Convertit des degrés en radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calcule le CO2 économisé basé sur la distance
 * Formule : distance_km * nb_passagers * 148g (émission moyenne voiture par km par personne)
 * @param {number} distanceKm - Distance en kilomètres
 * @param {number} passengers - Nombre de passagers
 * @returns {number} CO2 en grammes
 */
function calculateCO2Saved(distanceKm, passengers) {
    const CO2_PER_KM_PER_PERSON = 148; // grammes
    return Math.round(distanceKm * passengers * CO2_PER_KM_PER_PERSON);
}

/**
 * Calcule le prix suggéré basé sur la distance
 * Formule : distance_km * 0.06€ (prix moyen du covoiturage par km)
 * Arrondi à l'euro supérieur
 * @param {number} distanceKm - Distance en kilomètres
 * @returns {number} Prix suggéré en euros
 */
function calculateSuggestedPrice(distanceKm) {
    const PRICE_PER_KM = 0.06; // 6 centimes par km
    return Math.ceil(distanceKm * PRICE_PER_KM);
}

module.exports = {
    calculateDistance,
    calculateCO2Saved,
    calculateSuggestedPrice
};
