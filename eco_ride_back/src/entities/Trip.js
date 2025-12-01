class Trip {
    constructor(
        id,
        driver_id,
        start_address,
        start_latitude,
        start_longitude,
        end_address,
        end_latitude,
        end_longitude,
        distance_km,
        start_date,
        price_per_seat,
        total_seats,
        taken_seats = 0,
        status = 'available',
        co2 = 0,
        creation_date = new Date()
    ) {
        this.id = id;
        this.driver_id = driver_id;
        this.start_address = start_address;
        this.start_latitude = start_latitude;
        this.start_longitude = start_longitude;
        this.end_address = end_address;
        this.end_latitude = end_latitude;
        this.end_longitude = end_longitude;
        this.distance_km = distance_km;
        this.start_date = start_date;
        this.price_per_seat = price_per_seat;
        this.total_seats = total_seats;
        this.taken_seats = taken_seats;
        this.status = status;
        this.co2 = co2;
        this.creation_date = creation_date;
    }
}

module.exports = Trip;
