const TripRepository = require("../repositories/trip.repository");
const { calculateDistance, calculateCO2Saved, calculateTreesPlanted, calculateSuggestedPrice } = require("../utils/geoUtils");

/**
 * ===================================================================
 * CYCLE DE VIE DES STATUTS DE TRAJET
 * ===================================================================
 *
 * 1. available         → Trajet créé, places disponibles
 * 2. full              → Toutes les places réservées (géré par booking.services)
 * 3. pending_departure → Dans la fenêtre de 30min avant départ (géré par MySQL EVENT)
 * 4. opened            → Conducteur a cliqué sur "Ouvrir" (openTrip)
 * 5. in_progress       → Conducteur a cliqué sur "Démarrer" (startTrip)
 * 6. completed         → Conducteur a cliqué sur "Terminer" (completeTrip)
 * 7. cancelled         → Trajet annulé (auto si pas de passagers, ou manuellement)
 *
 * TRANSITIONS VALIDES :
 * - available → full (quand taken_seats === total_seats)
 * - available/full → pending_departure (auto via EVENT à 30min avant)
 * - available/full/pending_departure → cancelled (auto si pas de passagers)
 * - available/full/pending_departure → opened (action conducteur)
 * - opened → in_progress (action conducteur)
 * - in_progress → completed (action conducteur)
 *
 * ===================================================================
 */

const TripServices = {
    /**
     * Créer un nouveau trajet
     */
    async createTrip(tripData, driverId) {
        const {
            start_address, start_latitude, start_longitude,
            end_address, end_latitude, end_longitude,
            distance_km, // Distance routière réelle calculée par le frontend (OSRM)
            start_date, price_per_seat, total_seats
        } = tripData;

        // Calculer le CO2 et les arbres économisés basés sur la distance routière réelle
        const co2 = await calculateCO2Saved(distance_km, total_seats);
        const trees = await calculateTreesPlanted(distance_km, total_seats);

        // Créer le trajet
        const trip = await TripRepository.createTrip({
            driver_id: driverId,
            start_address, start_latitude, start_longitude,
            end_address, end_latitude, end_longitude,
            distance_km, // Distance routière réelle (OSRM)
            start_date, price_per_seat,
            total_seats, co2, trees
        });

        return trip;
    },

    /**
     * Récupérer tous les trajets disponibles avec filtres optionnels
     * Gère le filtrage géographique et textuel (logique métier)
     */
    async getAvailableTrips(status = 'available') {
        // Récupérer tous les trips depuis la DB
        const trips = await TripRepository.getAvailableTrips(status);
        return trips;
    },

    /**
     * Récupérer un trajet par ID
     * @param {number} id - ID du trajet
     * @param {number} userId - ID de l'utilisateur connecté (optionnel)
     * @param {string} userRole - Rôle de l'utilisateur (optionnel)
     * @returns {object} Trajet avec passagers si autorisé
     */
    async getTripById(id, userId = null, userRole = null) {
        const trip = await TripRepository.getTripById(id);
        if (!trip) throw new Error("TRIP_NOT_FOUND");

        // Si utilisateur connecté et autorisé → inclure passagers
        if (userId) {
            const BookingRepository = require("../repositories/booking.repository");

            const isDriver = trip.driver_id === userId;
            const isPassenger = await BookingRepository.isPassengerOfTrip(userId, id);
            const isAdmin = userRole === 'admin';

            if (isDriver || isPassenger || isAdmin) {
                trip.passengers = await BookingRepository.getPassengersByTrip(id);
            }
        }

        return trip;
    },

    /**
     * Calculer les gains d'un trajet pour le conducteur
     */
    calculateTripEarnings(trip) {
        const earnings = trip.taken_seats * trip.price_per_seat;
        const co2Saved = trip.co2 || 0; // CO2 en grammes
        const co2SavedKg = (co2Saved / 1000).toFixed(2); // Convertir en kg

        // 1 arbre planté pour chaque 50kg de CO2 économisé
        const treesPlanted = Math.floor(co2Saved / 50000);

        return {
            earnings,
            co2SavedKg,
            co2SavedGrams: co2Saved,
            treesPlanted
        };
    },

    /**
     * Mettre à jour les stats éco d'un conducteur après un trajet terminé
     */
    async updateDriverEcoStats(driverId, trip) {
        const UserRepository = require("../repositories/user.repository");

        const earnings = this.calculateTripEarnings(trip);

        // Mettre à jour le CO2 économisé et les arbres plantés
        await UserRepository.updateEcoStats(
            driverId,
            earnings.co2SavedGrams,
            earnings.treesPlanted
        );

        return earnings;
    },

    /**
     * Récupérer tous les trajets d'un utilisateur (conducteur + passager)
     * @param {number} requestingUserId - ID de l'utilisateur qui fait la demande
     * @param {number} targetUserId - ID de l'utilisateur dont on veut voir les trips (optionnel, défaut = requestingUserId)
     * @param {string} userRole - Rôle de l'utilisateur qui fait la demande
     * @returns {object} Trajets catégorisés (ongoing, upcoming, past)
     */
    async getUserTrips(requestingUserId, targetUserId = null, userRole = null) {
        const BookingRepository = require("../repositories/booking.repository");

        // Par défaut, on récupère les trips de l'utilisateur qui fait la demande
        const userId = targetUserId || requestingUserId;

        // Si on demande les trips d'un autre utilisateur, vérifier autorisation
        if (targetUserId && targetUserId !== requestingUserId) {
            if (userRole !== 'admin') {
                throw new Error("Vous n'êtes pas autorisé à voir les trajets d'un autre utilisateur");
            }
        }

        // Trajets en tant que conducteur
        const asDriver = await TripRepository.getTripsByDriver(userId);

        // Trajets en tant que passager
        const asPassengerRaw = await BookingRepository.getBookingsByPassenger(userId);

        // Formater les trajets passager (inclure validation_code et code_used)
        const asPassenger = asPassengerRaw.map(booking => ({
            ...booking,
            role: 'passenger',
            seats_booked: booking.seats_booked,
            validation_code: booking.validation_code,
            code_used: booking.code_used
        }));

        // Formater les trajets conducteur avec calcul des gains pour les trajets passés
        const driverTrips = [];
        for (const trip of asDriver) {
            const tripData = {
                ...trip,
                role: 'driver'
            };

            // Récupérer les passagers pour chaque trajet conducteur
            const passengers = await BookingRepository.getPassengersByTrip(trip.id);
            tripData.passengers = passengers.map(p => ({
                id: p.passenger_id,
                name: p.passenger_name,
                last_name: p.passenger_last_name || '',
                email: p.passenger_email,
                seats_booked: p.seats_booked,
                validation_code: p.validation_code,
                code_used: p.code_used
            }));

            // Pour les trajets passés, calculer les gains
            const now = new Date();
            const startDate = new Date(trip.start_date);
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            if (startDate <= oneHourAgo) {
                const earnings = this.calculateTripEarnings(trip);
                tripData.earnings = earnings.earnings;
                tripData.co2SavedKg = earnings.co2SavedKg;
                tripData.treesPlanted = earnings.treesPlanted;
            }

            driverTrips.push(tripData);
        }

        // Combiner et trier par date
        const allTrips = [...driverTrips, ...asPassenger].sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });

        // Catégoriser
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const categorizedTrips = {
            ongoing: allTrips.filter(t => {
                // Un trajet est "en cours" si :
                // - Son statut est 'pending_departure', 'opened' ou 'in_progress'
                // - ET il est dans la fenêtre temporelle
                const validOngoingStatuses = ['pending_departure', 'opened', 'in_progress'];
                const startDate = new Date(t.start_date);
                return validOngoingStatuses.includes(t.status) &&
                       startDate > oneHourAgo &&
                       startDate <= twoHoursFromNow;
            }),
            upcoming: allTrips.filter(t => {
                // Un trajet est "à venir" si :
                // - Son statut est 'available' ou 'full'
                // - ET la date est future (> maintenant)
                const validUpcomingStatuses = ['available', 'full'];
                const startDate = new Date(t.start_date);
                return validUpcomingStatuses.includes(t.status) &&
                       startDate > now;
            }),
            past: allTrips.filter(t => {
                // Un trajet est "passé" si :
                // - Son statut est 'completed' ou 'cancelled'
                // - OU la date est passée (< 1h)
                const isPastStatus = ['completed', 'cancelled'].includes(t.status);
                const startDate = new Date(t.start_date);
                const isPastDate = startDate <= oneHourAgo;
                return isPastStatus || isPastDate;
            })
        };

        // OPTIMISATION: Charger les passagers pour les trajets conducteur en ongoing/upcoming
        // Évite N+1 queries côté frontend
        const driverTripsNeedingPassengers = [
            ...categorizedTrips.ongoing.filter(t => t.role === 'driver'),
            ...categorizedTrips.upcoming.filter(t => t.role === 'driver')
        ];

        // Charger tous les passagers en parallèle (1 requête par trajet, mais en parallèle)
        if (driverTripsNeedingPassengers.length > 0) {
            await Promise.all(
                driverTripsNeedingPassengers.map(async (trip) => {
                    try {
                        const passengers = await BookingRepository.getPassengersByTrip(trip.id);
                        trip.passengers = passengers || [];
                    } catch (err) {
                        console.error(`Erreur chargement passagers pour trajet ${trip.id}:`, err);
                        trip.passengers = [];
                    }
                })
            );
        }

        return categorizedTrips;
    },

    /**
     * Ouvrir un trajet (conducteur uniquement)
     * Vérifie que:
     * - L'utilisateur est bien le conducteur
     * - Le trajet est dans la fenêtre temporelle (30 min avant -> 30 min après)
     * - Le conducteur est à moins de 300m du point de départ
     */
    async openTrip(tripId, driverId, currentLatitude, currentLongitude) {
        // 1. Récupérer le trajet
        const trip = await TripRepository.getTripById(tripId);
        if (!trip) {
            throw new Error("Trajet introuvable");
        }

        // 2. Vérifier que l'utilisateur est bien le conducteur
        if (trip.driver_id !== driverId) {
            throw new Error("Vous n'êtes pas le conducteur de ce trajet");
        }

        // 3. Vérifier que le trajet peut être ouvert
        const validStatusesForOpening = ['available', 'full', 'pending_departure'];
        if (!validStatusesForOpening.includes(trip.status)) {
            if (trip.status === 'opened') {
                throw new Error("Le trajet est déjà ouvert");
            }
            if (trip.status === 'in_progress') {
                throw new Error("Le trajet est déjà en cours");
            }
            if (trip.status === 'completed') {
                throw new Error("Le trajet est déjà terminé");
            }
            if (trip.status === 'cancelled') {
                throw new Error("Le trajet est annulé");
            }
            throw new Error(`Impossible d'ouvrir un trajet avec le statut: ${trip.status}`);
        }

        // 4. Vérifier la fenêtre temporelle (30 min avant -> 30 min après)
        const now = new Date();
        const startDate = new Date(trip.start_date);
        const thirtyMinutesBeforeStart = new Date(startDate.getTime() - 30 * 60 * 1000);
        const thirtyMinutesAfterStart = new Date(startDate.getTime() + 30 * 60 * 1000);

        if (now < thirtyMinutesBeforeStart) {
            const minutesRemaining = Math.ceil((thirtyMinutesBeforeStart - now) / (60 * 1000));
            throw new Error(`Trop tôt ! Vous pourrez ouvrir le trajet dans ${minutesRemaining} minute(s)`);
        }

        if (now > thirtyMinutesAfterStart) {
            throw new Error("Trop tard ! La fenêtre d'ouverture est dépassée (30 min après l'heure prévue)");
        }

        // 4.5. Annuler automatiquement si aucune réservation dans la fenêtre d'ouverture
        // On annule dès que le conducteur essaie d'ouvrir et qu'il n'y a personne
        if (trip.taken_seats === 0) {
            await TripRepository.update(tripId, { status: 'cancelled' });
            throw new Error("Ce trajet a été annulé automatiquement car aucun passager ne s'est inscrit");
        }

        // 4.6. Vérifier la proximité avec le point de départ (500m)
        const distanceKm = calculateDistance(
            currentLatitude,
            currentLongitude,
            trip.start_latitude,
            trip.start_longitude
        );
        const distanceMeters = distanceKm * 1000;

        if (distanceMeters > 50000) {
            throw new Error(`Vous êtes trop loin du point de départ (${Math.round(distanceMeters)}m). Rapprochez-vous à moins de 500m.`);
        }

        // 5. Ouvrir le trajet
        await TripRepository.openTrip(tripId);

        return {
            message: "Trajet ouvert avec succès",
            trip_id: tripId,
            opened_at: new Date()
        };
    },

    /**
     * Démarrer un trajet (conducteur uniquement)
     * Le trajet doit être ouvert
     */
    async startTrip(tripId, driverId) {
        // 1. Récupérer le trajet
        const trip = await TripRepository.getTripById(tripId);
        if (!trip) {
            throw new Error("Trajet introuvable");
        }

        // 2. Vérifier que l'utilisateur est bien le conducteur
        if (trip.driver_id !== driverId) {
            throw new Error("Vous n'êtes pas le conducteur de ce trajet");
        }

        // 3. Vérifier que le trajet est ouvert
        if (trip.status !== 'opened') {
            throw new Error("Le trajet doit être ouvert avant de pouvoir le démarrer");
        }

        // 4. Démarrer le trajet
        await TripRepository.startTrip(tripId);

        return {
            message: "Trajet démarré avec succès",
            trip_id: tripId,
            status: 'in_progress'
        };
    },

    /**
     * Terminer un trajet (conducteur uniquement)
     * Le conducteur doit être à moins de 1 km du point d'arrivée
     */
    async completeTrip(tripId, driverId, currentLatitude, currentLongitude) {
        // 1. Récupérer le trajet
        const trip = await TripRepository.getTripById(tripId);
        if (!trip) {
            throw new Error("Trajet introuvable");
        }

        // 2. Vérifier que l'utilisateur est bien le conducteur
        if (trip.driver_id !== driverId) {
            throw new Error("Vous n'êtes pas le conducteur de ce trajet");
        }

        // 3. Vérifier que le trajet est en cours
        if (trip.status !== 'in_progress') {
            throw new Error("Le trajet doit être en cours pour pouvoir le terminer");
        }

        // 4. Vérifier la proximité avec le point d'arrivée (1 km)
        const distanceKm = calculateDistance(
            currentLatitude,
            currentLongitude,
            trip.end_latitude,
            trip.end_longitude
        );

        if (distanceKm > 1) {
            throw new Error(`Vous êtes trop loin du point d'arrivée (${distanceKm.toFixed(2)} km). Rapprochez-vous à moins de 1 km.`);
        }

        // 5. Terminer le trajet
        await TripRepository.update(tripId, { status: 'completed' });

        return {
            message: "Trajet terminé avec succès",
            trip_id: tripId,
            status: 'completed',
            distance_from_end: Math.round(distance)
        };
    },

    /**
     * Calculer le prix d'un trajet avec promotions et abonnements
     * @param {number} tripId - ID du trajet
     * @param {number} userId - ID de l'utilisateur
     * @param {number} seatsBooked - Nombre de places à réserver
     * @returns {object} Détail du pricing avec promotions et abonnement
     */
    async calculateTripPricing(tripId, userId, seatsBooked) {
        const SubscriptionRepository = require("../repositories/subscription.repository");
        const PromotionServices = require("./promotion.services");

        // 1. Récupérer le trajet
        const trip = await TripRepository.findById(tripId);
        if (!trip) {
            throw new Error("Trajet introuvable");
        }

        // 2. Récupérer l'abonnement actif de l'utilisateur (si existe)
        const userSubscription = await SubscriptionRepository.getActiveSubscriptionByUserId(userId);

        // 3. Vérifier l'éligibilité du trajet pour les promotions
        const tripData = {
            startDate: trip.start_date,
            startLatitude: trip.start_latitude,
            startLongitude: trip.start_longitude,
            endLatitude: trip.end_latitude,
            endLongitude: trip.end_longitude
        };

        const eligiblePromotions = await PromotionServices.checkTripEligibility(tripData);

        // 4. Calculer le prix avec les promotions et l'abonnement
        const bookingData = {
            seatsBooked: parseInt(seatsBooked)
        };

        const tripPriceData = {
            pricePerSeat: trip.price_per_seat
        };

        const pricingResult = await PromotionServices.applyPromotionsToBooking(
            bookingData,
            tripPriceData,
            userSubscription,
            eligiblePromotions
        );

        // 5. Formater la réponse avec détails
        return {
            pricing: {
                basePriceEuros: (pricingResult.basePriceCents / 100).toFixed(2),
                baseFeePriceEuros: (pricingResult.baseFeeCents / 100).toFixed(2),
                serviceFeePercent: pricingResult.serviceFeePercent,
                totalFeeDiscountPercent: pricingResult.totalFeeDiscountPercent,
                discountedFeeEuros: (pricingResult.discountedFeeCents / 100).toFixed(2),
                totalPriceEuros: (pricingResult.totalPriceCents / 100).toFixed(2),
                treeMultiplier: pricingResult.treeMultiplier,
                savings: ((pricingResult.baseFeeCents - pricingResult.discountedFeeCents) / 100).toFixed(2)
            },
            subscription: userSubscription ? {
                planName: userSubscription.planName,
                reductionPercent: userSubscription.reductionPercent,
                multiplicatorTree: userSubscription.multiplicatorTree
            } : null,
            promotions: pricingResult.appliedPromotions.map(p => ({
                id: p.id,
                feeDiscountPercentage: p.feeDiscountPercentage,
                treeMultiplier: p.treeMultiplier
            }))
        };
    },

    /**
     * Mettre à jour un trajet
     * @param {number} tripId - ID du trajet
     * @param {number} userId - ID de l'utilisateur qui fait la demande
     * @param {string} userRole - Rôle de l'utilisateur
     * @param {object} updates - Champs à mettre à jour
     * @returns {object} Confirmation de mise à jour
     */
    async updateTrip(tripId, userId, userRole, updates) {
        // 1. Vérifier que le trajet existe
        const trip = await TripRepository.findById(tripId);
        if (!trip) {
            throw new Error("Trajet introuvable");
        }

        // 2. Vérifier autorisation: conducteur propriétaire OU admin
        if (trip.driver_id !== userId && userRole !== "admin") {
            throw new Error("Vous n'êtes pas autorisé à modifier ce trajet");
        }

        // 3. Champs autorisés pour mise à jour
        const allowedUpdates = {
            start_address: updates.start_address,
            end_address: updates.end_address,
            start_latitude: updates.start_latitude,
            start_longitude: updates.start_longitude,
            end_latitude: updates.end_latitude,
            end_longitude: updates.end_longitude,
            start_date: updates.start_date,
            price_per_seat: updates.price_per_seat,
            total_seats: updates.total_seats,
            status: updates.status
        };

        // 4. Retirer les champs undefined
        Object.keys(allowedUpdates).forEach(key =>
            allowedUpdates[key] === undefined && delete allowedUpdates[key]
        );

        if (Object.keys(allowedUpdates).length === 0) {
            throw new Error("Aucun champ à modifier");
        }

        // 5. Mettre à jour le trajet
        await TripRepository.update(tripId, allowedUpdates);

        return {
            message: "Trajet mis à jour avec succès"
        };
    },

    /**
     * Supprimer un trajet
     * @param {number} tripId - ID du trajet
     * @param {number} userId - ID de l'utilisateur qui fait la demande
     * @param {string} userRole - Rôle de l'utilisateur
     * @returns {object} Confirmation de suppression
     */
    async deleteTrip(tripId, userId, userRole) {
        // 1. Vérifier que le trajet existe
        const trip = await TripRepository.findById(tripId);
        if (!trip) {
            throw new Error("Trajet introuvable");
        }

        // 2. Vérifier autorisation: conducteur propriétaire OU admin
        if (trip.driver_id !== userId && userRole !== "admin") {
            throw new Error("Vous n'êtes pas autorisé à supprimer ce trajet");
        }

        // 3. Empêcher la suppression de trajets avec réservations confirmées
        if (trip.taken_seats > 0 && trip.status !== "cancelled") {
            throw new Error("Impossible de supprimer un trajet avec des réservations actives. Annulez-le d'abord.");
        }

        // 4. Supprimer le trajet
        await TripRepository.deleteTrip(tripId);

        return {
            message: "Trajet supprimé avec succès"
        };
    },

};

module.exports = TripServices;
