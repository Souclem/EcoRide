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
            total_seats, co2
        } = tripData;

        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO trips (
                    driver_id,
                    start_address, start_latitude, start_longitude,
                    end_address, end_latitude, end_longitude,
                    distance_km, start_date, price_per_seat,
                    total_seats, co2, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    driver_id,
                    start_address, start_latitude, start_longitude,
                    end_address, end_latitude, end_longitude,
                    distance_km, start_date, price_per_seat,
                    total_seats, co2, 'available'
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
    async getAvailableTrips(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM trips WHERE status = 'available' AND taken_seats < total_seats AND start_date > NOW()`;
            const params = [];

            // Filtre par date de début
            if (filters.startDate) {
                query += ` AND DATE(start_date) >= ?`;
                params.push(filters.startDate);
            }

            // Filtre par date de fin
            if (filters.endDate) {
                query += ` AND DATE(start_date) <= ?`;
                params.push(filters.endDate);
            }

            query += ` ORDER BY start_date ASC`;

            db.query(query, params, (err, results) => {
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
    }
};

module.exports = TripRepository;
