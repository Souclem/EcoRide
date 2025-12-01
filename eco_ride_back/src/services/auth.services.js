const UserRepository = require("../repositories/user.repository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const AuthServices = {
    async register(email, name, last_name, password, language = "fr") {
        const exists = await UserRepository.findByEmail(email);
        if (exists) throw new Error("EMAIL_EXISTS");

        const user = await UserRepository.createUser(email, name, last_name, password, language);
        const token = generateToken(user);

        return { user, token };
    },

    async login(email, password) {
        const user = await UserRepository.findByEmail(email);
        if (!user) throw new Error("INVALID_CREDENTIALS");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("INVALID_CREDENTIALS");

        const token = generateToken(user);

        return { user, token };
    }
};

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

module.exports = AuthServices;
