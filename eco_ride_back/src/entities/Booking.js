class Booking {
    constructor(
        id,
        trip_id,
        passenger_id,
        seats_booked = 1,
        status = 'confirmed',
        booking_date = new Date()
    ) {
        this.id = id;
        this.trip_id = trip_id;
        this.passenger_id = passenger_id;
        this.seats_booked = seats_booked;
        this.status = status;
        this.booking_date = booking_date;
    }
}

module.exports = Booking;
