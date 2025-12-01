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
                        row.co2_saved,
                        row.tree_planted
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
                        0
                    ));
                }
            );
        });
    }
};

module.exports = UserRepository;
