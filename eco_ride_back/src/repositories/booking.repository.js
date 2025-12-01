const db = require("../config/db");
const Booking = require("../entities/Booking");

const BookingRepository = {
    /**
     * Récupérer toutes les réservations d'un passager
     */
    async getBookingsByPassenger(passengerId) {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT
                    b.id as booking_id,
                    b.trip_id,
                    b.passenger_id,
                    b.seats_booked,
                    b.status as booking_status,
                    b.booking_date,
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
    },

    /**
     * Créer une réservation
     */
    async createBooking(bookingData) {
        const { trip_id, passenger_id, seats_booked } = bookingData;

        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO bookings (trip_id, passenger_id, seats_booked, status)
                 VALUES (?, ?, ?, 'confirmed')`,
                [trip_id, passenger_id, seats_booked],
                (err, results) => {
                    if (err) return reject(err);

                    resolve(new Booking(
                        results.insertId,
                        trip_id,
                        passenger_id,
                        seats_booked,
                        'confirmed',
                        new Date()
                    ));
                }
            );
        });
    }
};

module.exports = BookingRepository;
