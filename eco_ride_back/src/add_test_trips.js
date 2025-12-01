require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

console.log("🚗 Ajout de trajets de test avec dates futures...\n");

// Créer des dates futures (dans 2, 5, et 10 jours)
const now = new Date();
const date1 = new Date(now);
date1.setDate(date1.getDate() + 2);
date1.setHours(14, 30, 0, 0);

const date2 = new Date(now);
date2.setDate(date2.getDate() + 5);
date2.setHours(9, 0, 0, 0);

const date3 = new Date(now);
date3.setDate(date3.getDate() + 10);
date3.setHours(16, 45, 0, 0);

const testTrips = [
    {
        start_address: "Paris, Île-de-France, France",
        start_latitude: 48.8566,
        start_longitude: 2.3522,
        end_address: "Lyon, Auvergne-Rhône-Alpes, France",
        end_latitude: 45.764,
        end_longitude: 4.8357,
        distance_km: 465,
        start_date: date1.toISOString().slice(0, 19).replace('T', ' '),
        price_per_seat: 30,
        total_seats: 4,
        taken_seats: 0,
        co2: 93,
        status: 'available'
    },
    {
        start_address: "Marseille, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur, France",
        start_latitude: 43.2965,
        start_longitude: 5.3698,
        end_address: "Toulouse, Haute-Garonne, Occitanie, France",
        end_latitude: 43.6047,
        end_longitude: 1.4442,
        distance_km: 405,
        start_date: date2.toISOString().slice(0, 19).replace('T', ' '),
        price_per_seat: 25,
        total_seats: 3,
        taken_seats: 1,
        co2: 81,
        status: 'available'
    },
    {
        start_address: "Lille, Nord, Hauts-de-France, France",
        start_latitude: 50.6292,
        start_longitude: 3.0573,
        end_address: "Strasbourg, Bas-Rhin, Grand Est, France",
        end_latitude: 48.5734,
        end_longitude: 7.7521,
        distance_km: 530,
        start_date: date3.toISOString().slice(0, 19).replace('T', ' '),
        price_per_seat: 35,
        total_seats: 3,
        taken_seats: 0,
        co2: 106,
        status: 'available'
    },
    {
        start_address: "Bordeaux, Gironde, Nouvelle-Aquitaine, France",
        start_latitude: 44.8378,
        start_longitude: -0.5792,
        end_address: "Nantes, Loire-Atlantique, Pays de la Loire, France",
        end_latitude: 47.2184,
        end_longitude: -1.5536,
        distance_km: 330,
        start_date: date1.toISOString().slice(0, 19).replace('T', ' '),
        price_per_seat: 22,
        total_seats: 4,
        taken_seats: 2,
        co2: 66,
        status: 'available'
    },
    {
        start_address: "Nice, Alpes-Maritimes, Provence-Alpes-Côte d'Azur, France",
        start_latitude: 43.7102,
        start_longitude: 7.2620,
        end_address: "Monaco, Monaco",
        end_latitude: 43.7384,
        end_longitude: 7.4246,
        distance_km: 20,
        start_date: date2.toISOString().slice(0, 19).replace('T', ' '),
        price_per_seat: 5,
        total_seats: 3,
        taken_seats: 0,
        co2: 4,
        status: 'available'
    }
];

let inserted = 0;
let errors = 0;

testTrips.forEach((trip, index) => {
    db.query(
        `INSERT INTO trips (
            start_address, start_latitude, start_longitude,
            end_address, end_latitude, end_longitude,
            distance_km, start_date, price_per_seat,
            total_seats, taken_seats, co2, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            trip.start_address, trip.start_latitude, trip.start_longitude,
            trip.end_address, trip.end_latitude, trip.end_longitude,
            trip.distance_km, trip.start_date, trip.price_per_seat,
            trip.total_seats, trip.taken_seats, trip.co2, trip.status
        ],
        (err, results) => {
            if (err) {
                console.error(`❌ Erreur insertion trajet ${index + 1}:`, err.message);
                errors++;
            } else {
                console.log(`✅ Trajet ${index + 1} ajouté: ${trip.start_address} → ${trip.end_address} (${trip.start_date})`);
                inserted++;
            }

            // Si c'est le dernier trajet, afficher le résumé et fermer
            if (index === testTrips.length - 1) {
                setTimeout(() => {
                    console.log(`\n📊 Résumé: ${inserted} trajets ajoutés, ${errors} erreurs`);
                    process.exit(0);
                }, 100);
            }
        }
    );
});
