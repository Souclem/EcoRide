const db = require("../config/db");
const Booking = require("../entities/Booking");


class BookingRepository {
    /**
     * Récupérer toutes les réservations d'un passager
     */
    static async getBookingsByPassenger(passengerId) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT
                    b.id as booking_id,
                    b.trip_id,
                    b.passenger_id,
                    b.seats_booked,
                    b.status as booking_status,
                    b.booking_date,
                    b.validation_code,
                    b.code_used,
                    b.total_price_cents,
                    b.stripe_payment_intent_id,
                    b.rating,
                    b.review_comment,
                    b.reviewed_at,
                    t.id,
                    t.driver_id,
                    t.start_address,
                    t.start_latitude,
                    t.start_longitude,
                    t.end_address,
                    t.end_latitude,
                    t.end_longitude,
                    t.distance_km,
                    t.start_date,
                    t.price_per_seat,
                    t.total_seats,
                    t.taken_seats,
                    t.status,
                    t.co2,
                    t.creation_date
                 FROM bookings b
                 JOIN trips t ON b.trip_id = t.id
                 WHERE b.passenger_id = ?
                 ORDER BY t.start_date DESC`,
                [passengerId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Créer une réservation avec code de validation
     */
    static async create(bookingData) {
        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO bookings
                (trip_id, passenger_id, seats_booked, status, validation_code, total_price_cents)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    bookingData.trip_id,
                    bookingData.passenger_id,
                    bookingData.seats_booked || 1,
                    bookingData.status || 'pending',
                    bookingData.validation_code,
                    bookingData.total_price_cents || null
                ],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results.insertId);
                }
            );
        });
    }

    /**
     * Trouver une réservation par ID
     */
    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM bookings WHERE id = ?",
                [id],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results.length > 0 ? Booking.fromDb(results[0]) : null);
                }
            );
        });
    }

    /**
     * Trouver une réservation par code de validation
     */
    static async findByValidationCode(code) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT b.*, t.driver_id, t.start_date, t.status as trip_status
                 FROM bookings b
                 JOIN trips t ON b.trip_id = t.id
                 WHERE b.validation_code = ?`,
                [code],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results.length > 0 ? results[0] : null);
                }
            );
        });
    }

    /**
     * Marquer le code comme utilisé
     */
    static async markCodeAsUsed(bookingId) {
        return new Promise((resolve, reject) => {
            db.query(
                "UPDATE bookings SET code_used = TRUE WHERE id = ?",
                [bookingId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Mettre à jour le statut d'une réservation
     */
    static async updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            db.query(
                "UPDATE bookings SET status = ? WHERE id = ?",
                [status, id],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Vérifier si un utilisateur a déjà réservé un trajet
     */
    static async hasUserBookedTrip(userId, tripId) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT COUNT(*) as count FROM bookings
                 WHERE passenger_id = ? AND trip_id = ? AND status != 'cancelled'`,
                [userId, tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                }
            );
        });
    }

    /**
     * Vérifier si un utilisateur est passager d'un trajet (alias pour hasUserBookedTrip)
     */
    static async isPassengerOfTrip(userId, tripId) {
        return this.hasUserBookedTrip(userId, tripId);
    }

    /**
     * Récupérer les réservations d'un trajet
     */
    static async getBookingsByTrip(tripId) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT b.*, u.name, u.email
                 FROM bookings b
                 JOIN users u ON b.passenger_id = u.id
                 WHERE b.trip_id = ? AND b.status = 'confirmed'`,
                [tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results.map(row => Booking.fromDb(row)));
                }
            );
        });
    }

    /**
     * Récupérer les passagers d'un trajet (pour le conducteur)
     */
    static async getPassengersByTrip(tripId) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT
                    b.id,
                    b.seats_booked,
                    b.validation_code,
                    b.code_used,
                    u.id as passenger_id,
                    u.name as passenger_name,
                    u.last_name as passenger_last_name,
                    u.email as passenger_email
                 FROM bookings b
                 JOIN users u ON b.passenger_id = u.id
                 WHERE b.trip_id = ? AND b.status = 'confirmed'
                 ORDER BY b.booking_date ASC`,
                [tripId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Récupérer une réservation avec les détails du trajet
     */
    static async getBookingWithTripDetails(bookingId) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT
                    b.*,
                    t.status as trip_status,
                    t.start_date
                 FROM bookings b
                 JOIN trips t ON b.trip_id = t.id
                 WHERE b.id = ?`,
                [bookingId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0] || null);
                }
            );
        });
    }

    /**
     * Ajouter un avis à une réservation
     */
    static async addReview(bookingId, rating, comment) {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE bookings
                 SET rating = ?, review_comment = ?, reviewed_at = NOW()
                 WHERE id = ?`,
                [rating, comment, bookingId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Mettre à jour les informations de paiement Stripe
     */
    static async updatePaymentInfo(bookingId, paymentData) {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE bookings
                 SET stripe_payment_intent_id = ?
                 WHERE id = ?`,
                [
                    paymentData.stripe_payment_intent_id,
                    bookingId
                ],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Récupérer toutes les réservations avec informations de paiement (pour admin)
     */
    static async getAllBookingsWithPayments() {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT
                    b.id,
                    b.trip_id,
                    b.passenger_id,
                    b.seats_booked,
                    b.status,
                    b.booking_date,
                    b.total_price_cents,
                    b.stripe_payment_intent_id,
                    u.name as passenger_name,
                    u.last_name as passenger_last_name,
                    u.email as passenger_email,
                    t.start_address,
                    t.end_address,
                    t.start_date
                 FROM bookings b
                 JOIN users u ON b.passenger_id = u.id
                 JOIN trips t ON b.trip_id = t.id
                 ORDER BY b.booking_date DESC`,
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }

    /**
     * Trouver une réservation par Stripe PaymentIntent ID
     */
    static async findByStripePaymentIntentId(stripePaymentIntentId) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM bookings WHERE stripe_payment_intent_id = ?",
                [stripePaymentIntentId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results.length > 0 ? Booking.fromDb(results[0]) : null);
                }
            );
        });
    }

    /**
     * Récupérer toutes les réservations (alias pour getAllBookingsWithPayments)
     */
    static async getAllBookings() {
        return this.getAllBookingsWithPayments();
    }

    /**
     * Mettre à jour une réservation (champs dynamiques)
     */
    static async update(bookingId, updates) {
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

            values.push(bookingId);

            const sql = `UPDATE bookings SET ${fields.join(", ")} WHERE id = ?`;

            db.query(sql, values, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    /**
     * Supprimer une réservation
     */
    static async deleteBooking(bookingId) {
        return new Promise((resolve, reject) => {
            db.query(
                "DELETE FROM bookings WHERE id = ?",
                [bookingId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }
}

module.exports = BookingRepository;
