class Booking {
    constructor(data) {
        this.id = data.id;
        this.trip_id = data.trip_id;
        this.passenger_id = data.passenger_id;
        this.seats_booked = data.seats_booked;
        this.status = data.status ;
        this.booking_date = data.booking_date ;
        this.validation_code = data.validation_code;
        this.code_used = data.code_used || false;
        this.total_price_cents = data.total_price_cents;
        this.stripe_payment_intent_id = data.stripe_payment_intent_id;
        this.rating = data.rating;
        this.review_comment = data.review_comment;
        this.reviewed_at = data.reviewed_at;
    }

    static fromDb(row) {
        return new Booking({
            id: row.id,
            trip_id: row.trip_id,
            passenger_id: row.passenger_id,
            seats_booked: row.seats_booked,
            status: row.status,
            booking_date: row.booking_date,
            validation_code: row.validation_code,
            code_used: row.code_used === 1 || row.code_used === true,
            total_price_cents: row.total_price_cents,
            stripe_payment_intent_id: row.stripe_payment_intent_id,
            rating: row.rating,
            review_comment: row.review_comment,
            reviewed_at: row.reviewed_at
        });
    }
}

module.exports = Booking;
