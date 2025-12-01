// Test détaillé des repositories
const db = require('./src/config/db');
const TripRepository = require('./src/repositories/trip.repository');
const BookingRepository = require('./src/repositories/booking.repository');

async function testRepositories() {
    try {
        console.log('=== Test TripRepository.getTripsByDriver(1) ===');
        const driverTrips = await TripRepository.getTripsByDriver(1);
        console.log('Nombre de trajets conducteur:', driverTrips.length);
        console.log('Trajets:', driverTrips.map(t => ({
            id: t.id,
            start_address: t.start_address,
            end_address: t.end_address,
            start_date: t.start_date
        })));

        console.log('\n=== Test BookingRepository.getBookingsByPassenger(1) ===');
        const passengerTrips = await BookingRepository.getBookingsByPassenger(1);
        console.log('Nombre de trajets passager:', passengerTrips.length);
        console.log('Bookings:', passengerTrips.map(t => ({
            booking_id: t.id,
            trip_id: t.trip_id,
            start_address: t.start_address,
            end_address: t.end_address,
            start_date: t.start_date
        })));

        console.log('\n=== Test TripServices.getUserTrips(1) ===');
        const TripServices = require('./src/services/trip.services');
        const result = await TripServices.getUserTrips(1);

        console.log('Ongoing:', result.ongoing.length);
        console.log('Upcoming:', result.upcoming.length);
        console.log('Past:', result.past.length);

        if (result.ongoing.length > 0) {
            console.log('\nOngoing trips:', result.ongoing);
        }
        if (result.upcoming.length > 0) {
            console.log('\nUpcoming trips:', result.upcoming);
        }
        if (result.past.length > 0) {
            console.log('\nPast trips:', result.past);
        }

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

testRepositories();
