const db = require("../config/db");
const User = require("../entities/User");
const bcrypt = require("bcrypt");

const UserRepository = {
    findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM users WHERE email = ?",
                [email],
                (err, results) => {
                    if (err) return reject(err);
                    if (!results[0]) return resolve(null);

                    const row = results[0];
                    resolve(new User(
                        row.id,
                        row.email,
                        row.name,
                        row.last_name,
                        row.password,
                        row.preferred_language,
                        row.creation_date,
                        row.role,
                        row.total_co2_saved,
                        row.total_trees_planted,
                        row.rating
                    ));
                }
            );
        });
    },

    findById(userId) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM users WHERE id = ?",
                [userId],
                (err, results) => {
                    if (err) return reject(err);
                    if (!results[0]) return resolve(null);

                    const row = results[0];
                    resolve(new User(
                        row.id,
                        row.email,
                        row.name,
                        row.last_name,
                        row.password,
                        row.preferred_language,
                        row.creation_date,
                        row.role,
                        row.total_co2_saved,
                        row.total_trees_planted,
                        row.rating
                    ));
                }
            );
        });
    },

    async createUser(email, name, last_name, password, language = "fr") {
        const hashed = await bcrypt.hash(password, 10);

        return new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO users (email, name, last_name, password, preferred_language, role) VALUES (?, ?, ?, ?, ?, ?)",
                [email, name, last_name, hashed, language, 'user'],
                (err, results) => {
                    if (err) return reject(err);

                    resolve(new User(
                        results.insertId,
                        email,
                        name,
                        last_name,
                        hashed,
                        language,
                        new Date(),
                        'user',
                        0,
                        0,
                        null
                    ));
                }
            );
        });
    },

    /**
     * Mettre à jour le CO2 économisé et les arbres plantés pour un utilisateur
     */
    updateEcoStats(userId, co2ToAdd, treesToAdd) {
        return new Promise((resolve, reject) => {
            // Arrondir vers le bas pour s'assurer que ce sont des entiers
            const co2Int = Math.floor(co2ToAdd);
            const treesInt = Math.floor(treesToAdd);

            db.query(
                `UPDATE users
                 SET total_co2_saved = total_co2_saved + ?,
                     total_trees_planted = total_trees_planted + ?
                 WHERE id = ?`,
                [co2Int, treesInt, userId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },


    /**
     * Récupérer les statistiques globales de tous les utilisateurs
     */
    getGlobalStats() {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT
                    SUM(total_co2_saved) as total_co2,
                    SUM(total_trees_planted) as total_trees,
                    COUNT(*) as total_users
                 FROM users`,
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0] || { total_co2: 0, total_trees: 0, total_users: 0 });
                }
            );
        });
    },

    /**
     * Mettre à jour le profil d'un utilisateur
     */
    updateProfile(userId, { name, last_name, email, preferred_language }) {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE users
                 SET name = ?, last_name = ?, email = ?, preferred_language = ?
                 WHERE id = ?`,
                [name, last_name, email, preferred_language, userId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    },

    /**
     * Récupérer tous les utilisateurs
     */
    getAllUsers() {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM users ORDER BY creation_date DESC",
                (err, results) => {
                    if (err) return reject(err);

                    const users = results.map(row => new User(
                        row.id,
                        row.email,
                        row.name,
                        row.last_name,
                        row.password,
                        row.preferred_language,
                        row.creation_date,
                        row.role,
                        row.total_co2_saved,
                        row.total_trees_planted,
                        row.rating
                    ));

                    resolve(users);
                }
            );
        });
    },

    /**
     * Mettre à jour un utilisateur (champs dynamiques)
     */
    update(userId, updates) {
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

            values.push(userId);

            const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

            db.query(sql, values, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },

    /**
     * Supprimer un utilisateur
     */
    deleteUser(userId) {
        return new Promise((resolve, reject) => {
            db.query(
                "DELETE FROM users WHERE id = ?",
                [userId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }
};

module.exports = UserRepository;
