console.log("══════════════════════════════════");
console.log("      DEBUG DOTENV / MYSQL");
console.log("══════════════════════════════════");

const path = require("path");
const fs = require("fs");

// 1. Où Node pense se trouver ?
console.log("\n1️⃣  process.cwd() (répertoire d'exécution Node) :");
console.log(process.cwd());

// 2. Où est le fichier .env attendu par défaut ?
const expectedEnvPath = path.join(process.cwd(), ".env");
console.log("\n2️⃣  Chemin où dotenv va chercher .env :");
console.log(expectedEnvPath);

// 3. Le fichier .env existe-t-il à cet endroit ?
console.log("\n3️⃣  .env existe ici ? :", fs.existsSync(expectedEnvPath));

// 4. Charger dotenv
console.log("\n4️⃣  Chargement de dotenv…");
require("dotenv").config({
    path: expectedEnvPath // force la lecture depuis process.cwd()
});

// 5. Afficher les variables chargées
console.log("\n5️⃣  Variables d'environnement chargées :");
console.log({
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT
});

// 6. Tester connexion MySQL
console.log("\n6️⃣  Test de connexion MySQL…");

const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("\n❌ ERREUR DE CONNEXION MYSQL :");
        console.error(err);
        console.log("══════════════════════════════════");
        process.exit(1);
    }

    console.log("\n✅ CONNEXION MYSQL OK !");
    connection.release();
    console.log("══════════════════════════════════");
    process.exit(0);
});
