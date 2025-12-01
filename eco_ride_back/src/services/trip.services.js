const TripRepository = require("../repositories/trip.repository");
const { calculateDistance, calculateCO2Saved, calculateSuggestedPrice } = require("../utils/geoUtils");

const TripServices = {
    /**
     * Créer un nouveau trajet
     */
    async createTrip(tripData, driverId) {
        const {
            start_address, start_latitude, start_longitude,
            end_address, end_latitude, end_longitude,
            start_date, price_per_seat, total_seats
        } = tripData;

        // Calculer la distance automatiquement
        const distance_km = calculateDistance(
            start_latitude, start_longitude,
            end_latitude, end_longitude
        );

        // Calculer le CO2 économisé
        const co2 = calculateCO2Saved(distance_km, total_seats);

        // Créer le trajet
        const trip = await TripRepository.createTrip({
            driver_id: driverId,
            start_address, start_latitude, start_longitude,
            end_address, end_latitude, end_longitude,
            distance_km, start_date, price_per_seat,
            total_seats, co2
        });

        return trip;
    },

    /**
     * Récupérer tous les trajets disponibles avec filtres optionnels
     * Gère le filtrage géographique et textuel (logique métier)
     */
    async getAvailableTrips(filters = {}) {
        // Récupérer tous les trips depuis la DB avec filtres de date uniquement
        let trips = await TripRepository.getAvailableTrips({
            startDate: filters.startDate,
            endDate: filters.endDate
        });

        // Filtrage géographique si coordonnées fournies
        if (filters.startLat && filters.startLng && filters.endLat && filters.endLng) {
            const radius = filters.radius || 50; // Rayon par défaut : 50 km

            trips = trips.filter(trip => {
                // Distance entre le point de départ recherché et le point de départ du trajet
                const startDistance = calculateDistance(
                    parseFloat(filters.startLat),
                    parseFloat(filters.startLng),
                    parseFloat(trip.start_latitude),
                    parseFloat(trip.start_longitude)
                );

                // Distance entre le point d'arrivée recherché et le point d'arrivée du trajet
                const endDistance = calculateDistance(
                    parseFloat(filters.endLat),
                    parseFloat(filters.endLng),
                    parseFloat(trip.end_latitude),
                    parseFloat(trip.end_longitude)
                );

                // Le trajet est valide si les deux points sont dans le rayon
                return startDistance <= radius && endDistance <= radius;
            });
        }
        // Sinon, filtrage textuel
        else if (filters.startAddress || filters.endAddress) {
            trips = trips.filter(trip => {
                let match = true;

                if (filters.startAddress) {
                    match = match && trip.start_address.toLowerCase().includes(filters.startAddress.toLowerCase());
                }

                if (filters.endAddress) {
                    match = match && trip.end_address.toLowerCase().includes(filters.endAddress.toLowerCase());
                }

                return match;
            });
        }

        return trips;
    },

    /**
     * Récupérer un trajet par ID
     */
    async getTripById(id) {
        const trip = await TripRepository.getTripById(id);
        if (!trip) throw new Error("TRIP_NOT_FOUND");
        return trip;
    },

    /**
     * Calculer la distance et le prix suggéré entre deux points
     */
    calculateTripEstimate(startLat, startLng, endLat, endLng) {
        const distance = calculateDistance(startLat, startLng, endLat, endLng);
        const suggestedPrice = calculateSuggestedPrice(distance);

        return {
            distance_km: distance,
            suggested_price: suggestedPrice
        };
    },

    /**
     * Récupérer tous les trajets d'un utilisateur (conducteur + passager)
     */
    async getUserTrips(userId) {
        const BookingRepository = require("../repositories/booking.repository");

        // Trajets en tant que conducteur
        const asDriver = await TripRepository.getTripsByDriver(userId);

        // Trajets en tant que passager
        const asPassengerRaw = await BookingRepository.getBookingsByPassenger(userId);

        // Formater les trajets passager
        const asPassenger = asPassengerRaw.map(booking => ({
            ...booking,
            role: 'passenger',
            seats_booked: booking.seats_booked
        }));

        // Formater les trajets conducteur
        const driverTrips = asDriver.map(trip => ({
            ...trip,
            role: 'driver'
        }));

        // Combiner et trier par date
        const allTrips = [...driverTrips, ...asPassenger].sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });

        // Catégoriser
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        return {
            ongoing: allTrips.filter(t => {
                const startDate = new Date(t.start_date);
                return startDate > oneHourAgo && startDate <= twoHoursFromNow;
            }),
            upcoming: allTrips.filter(t => {
                const startDate = new Date(t.start_date);
                return startDate > twoHoursFromNow;
            }),
            past: allTrips.filter(t => {
                const startDate = new Date(t.start_date);
                return startDate <= oneHourAgo;
            })
        };
    }
};

module.exports = TripServices;
