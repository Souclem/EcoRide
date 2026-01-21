const db = require("../config/db");
const Trip = require("../entities/Trip");

const TripRepository = {
    /**
     * Créer un nouveau trajet
     */
    async createTrip(tripData) {
        const {
            driver_id,
            start_address, start_latitude, start_longitude,
            end_address, end_latitude, end_longitude,
            distance_km, start_date, price_per_seat,
            total_seats, co2, trees
        } = tripData;

        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO trips (
                    driver_id,
                    start_address, start_latitude, start_longitude,
                    end_address, end_latitude, end_longitude,
                    distance_km, start_date, price_per_seat,
                    total_seats, co2, trees, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    driver_id,
                    start_address, start_latitude, start_longitude,
                    end_address, end_latitude, end_longitude,
                    distance_km, start_date, price_per_seat,
                    total_seats, co2, trees, 'available'
                ],
                (err, results) => {
                    if (err) return reject(err);

                    resolve(new Trip(
                        results.insertId,
                        driver_id,
                        start_address, start_latitude, start_longitude,
                        end_address, end_latitude, end_longitude,
                        distance_km, start_date, price_per_seat,
                        total_seats, 0, 'available', co2, new Date()
                    ));
                }
            );
        });
    },

    /**
     * Récupérer tous les trajets disponibles avec filtres SQL uniquement
     * Le filtrage métier (géographique, textuel) est fait dans le Service
     */
    async getAvailableTrips(status = 'available') {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT
                    trips.*,
                    users.name as driver_name,
                    users.last_name as driver_last_name,
                    users.rating as driver_rating,
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'rating', b.rating,
                                'comment', b.review_comment,
                                'reviewed_at', b.reviewed_at,
                                'passenger_name', u2.name,
                                'passenger_last_name', u2.last_name,
                                'trip_date', t2.start_date
                            )
                        )
                        FROM bookings b
                        JOIN trips t2 ON b.trip_id = t2.id
                        JOIN users u2 ON b.passenger_id = u2.id
                        WHERE t2.driver_id = trips.driver_id
                          AND b.rating IS NOT NULL
                        ORDER BY b.reviewed_at DESC
                        LIMIT 5
                    ) as driver_reviews,
                    (
                        SELECT COUNT(*)
                        FROM bookings b
                        JOIN trips t2 ON b.trip_id = t2.id
                        WHERE t2.driver_id = trips.driver_id
                          AND b.rating IS NOT NULL
                    ) as driver_rating_count
                FROM trips
                LEFT JOIN users ON trips.driver_id = users.id
                WHERE 1=1
            `;

            // Filtre par statut (par défaut: available uniquement)
            if (status === 'all') {
                // Admin: voir tous les trajets
            } else {
                // Public: uniquement les trajets disponibles avec places disponibles
                query += ` AND trips.status = 'available'
                          AND trips.taken_seats < trips.total_seats
                          AND trips.start_date > NOW()`;
            }

            query += ` ORDER BY trips.start_date ASC`;

            db.query(query, (err, results) => {
                if (err) return reject(err);

                const trips = results.map(row => {
                    const trip = new Trip(
                        row.id,
                        row.driver_id,
                        row.start_address, row.start_latitude, row.start_longitude,
                        row.end_address, row.end_latitude, row.end_longitude,
                        row.distance_km, row.start_date, row.price_per_seat,
                        row.total_seats, row.taken_seats, row.status,
                        row.co2, row.creation_date
                    );

                    // Ajouter les informations du conducteur
                    trip.driver_name = row.driver_name;
                    trip.driver_last_name = row.driver_last_name;
                    trip.driver_rating = parseFloat(row.driver_rating);

                    // Ajouter les avis du conducteur (jusqu'à 5 derniers)
                    // mysql2 parse automatiquement les colonnes JSON, pas besoin de JSON.parse()
                    trip.driver_reviews = row.driver_reviews || [];

                    // Nombre total d'avis du conducteur (pas limité à 5)
                    trip.driver_rating_count = row.driver_rating_count || 0;

                    return trip;
                });

                resolve(trips);
            });
        });
    },

    /**
     * Récupérer un trajet par ID
     */
    async getTripById(id) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM trips WHERE id = ?",
                [id],
                (err, results) => {
                    if (err) return reject(err);
                    if (!results[0]) return resolve(null);

                    const row = results[0];
                    resolve(new Trip(
                        row.id,
                        row.driver_id,
                        row.start_address, row.start_latitude, row.start_longitude,
                        row.end_address, row.end_latitude, row.end_longitude,
                        row.distance_km, row.start_date, row.price_per_seat,
                        row.total_seats, row.taken_seats, row.status,
                        row.co2, row.creation_date
                    ));
                }
            );
        });
    },

    /**
     * Alias pour getTripById (utilisé par BookingService)
     */
    async findById(id) {
        return this.getTripById(id);
    },

    /**
     * Mettre à jour le nombre de places prises
     */
    async updateTakenSeats(tripId, takenSeats) {
        return new Promise((resolve, reject) => {
            db.query(
                "UPDATE trips SET taken_seats = ? WHERE id = ?",
                [takenSeats, tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    /**
     * Mettre à jour le statut d'un trajet
     */
    async updateStatus(tripId, status) {
        return new Promise((resolve, reject) => {
            db.query(
                "UPDATE trips SET status = ? WHERE id = ?",
                [status, tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    /**
     * Récupérer tous les trajets d'un conducteur
     */
    async getTripsByDriver(driverId) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM trips WHERE driver_id = ? ORDER BY start_date DESC",
                [driverId],
                (err, results) => {
                    if (err) return reject(err);

                    const trips = results.map(row => new Trip(
                        row.id,
                        row.driver_id,
                        row.start_address, row.start_latitude, row.start_longitude,
                        row.end_address, row.end_latitude, row.end_longitude,
                        row.distance_km, row.start_date, row.price_per_seat,
                        row.total_seats, row.taken_seats, row.status,
                        row.co2, row.creation_date
                    ));

                    resolve(trips);
                }
            );
        });
    },

    /**
     * Ouvrir un trajet (marquer comme ouvert par le conducteur)
     */
    async openTrip(tripId) {
        return new Promise((resolve, reject) => {
            db.query(
                "UPDATE trips SET status = 'opened', opened_at = NOW() WHERE id = ?",
                [tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    /**
     * Démarrer un trajet (passer en cours)
     */
    async startTrip(tripId) {
        return new Promise((resolve, reject) => {
            db.query(
                "UPDATE trips SET status = 'in_progress' WHERE id = ?",
                [tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    /**
     * Mettre à jour un trajet (champs dynamiques)
     */
    async update(tripId, updates) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            // Construction dynamique de la requête
            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }

            if (fields.length === 0) {
                return resolve({ affectedRows: 0 });
            }

            values.push(tripId);

            const sql = `UPDATE trips SET ${fields.join(", ")} WHERE id = ?`;

            db.query(sql, values, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    /**
     * Supprimer un trajet
     */
    async deleteTrip(tripId) {
        return new Promise((resolve, reject) => {
            db.query(
                "DELETE FROM trips WHERE id = ?",
                [tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    /**
     * Récupérer tous les trajets (pour admin)
     * Retourne tous les trajets avec les informations du conducteur
     */
    async getAllTrips() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    t.*,
                    u.name as driver_name,
                    u.last_name as driver_last_name,
                    u.email as driver_email
                FROM trips t
                JOIN users u ON t.driver_id = u.id
                ORDER BY t.start_date DESC
            `;

            db.query(query, (err, results) => {
                if (err) return reject(err);

                const trips = results.map(row => {
                    const trip = new Trip(
                        row.id,
                        row.driver_id,
                        row.start_address, row.start_latitude, row.start_longitude,
                        row.end_address, row.end_latitude, row.end_longitude,
                        row.distance_km, row.start_date, row.price_per_seat,
                        row.total_seats, row.taken_seats, row.status,
                        row.co2, row.creation_date
                    );

                    // Ajouter les infos du conducteur
                    trip.driver_name = row.driver_name;
                    trip.driver_last_name = row.driver_last_name;
                    trip.driver_email = row.driver_email;

                    return trip;
                });

                resolve(trips);
            });
        });
    }
};

module.exports = TripRepository;
