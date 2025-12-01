require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

console.log("🔍 Vérification des trajets dans la base de données...\n");

// Requête 1 : Tous les trajets
db.query("SELECT * FROM trips", (err, results) => {
    if (err) {
        console.error("❌ Erreur lors de la requête:", err);
        process.exit(1);
    }

    console.log(`📊 Nombre total de trajets dans la base: ${results.length}\n`);

    if (results.length === 0) {
        console.log("❌ Aucun trajet trouvé dans la base de données!");
        console.log("💡 Vous devez créer des trajets via l'interface ou ajouter des données de test.\n");
    } else {
        console.log("✅ Trajets trouvés:\n");
        results.forEach((trip, index) => {
            console.log(`--- Trajet #${index + 1} ---`);
            console.log(`ID: ${trip.id}`);
            console.log(`Départ: ${trip.start_address}`);
            console.log(`Arrivée: ${trip.end_address}`);
            console.log(`Date: ${trip.start_date}`);
            console.log(`Status: ${trip.status}`);
            console.log(`Places: ${trip.taken_seats}/${trip.total_seats}`);
            console.log("");
        });
    }

    // Requête 2 : Trajets disponibles selon les critères de l'API
    db.query(
        `SELECT * FROM trips
         WHERE status = 'available'
         AND taken_seats < total_seats
         AND start_date > NOW()
         ORDER BY start_date ASC`,
        (err2, results2) => {
            if (err2) {
                console.error("❌ Erreur lors de la requête des trajets disponibles:", err2);
                process.exit(1);
            }

            console.log(`\n📊 Trajets disponibles (selon critères API): ${results2.length}`);

            if (results2.length === 0 && results.length > 0) {
                console.log("\n⚠️  Il y a des trajets dans la base, mais aucun ne correspond aux critères:");
                console.log("   - status = 'available'");
                console.log("   - taken_seats < total_seats");
                console.log("   - start_date > NOW()");
                console.log("\n💡 Les trajets existants ont peut-être une date passée ou un statut différent.\n");
            }

            process.exit(0);
        }
    );
});
