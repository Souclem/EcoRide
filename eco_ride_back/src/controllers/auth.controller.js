const AuthService = require("../services/auth.services");

const AuthController = {
    async register(req, res) {
        try {
            const { email, name, last_name, password, language } = req.body;
            console.log("📝 Tentative d'inscription:", { email, name, last_name, language });
            const { user, token } = await AuthService.register(email, name, last_name, password, language);

            return res.status(201).json({ user, token });
        } catch (err) {
            console.error("❌ Erreur register:", err);
            if (err.message === "EMAIL_EXISTS")
                return res.status(409).json({ message: "Cet email est déjà utilisé" });

            return res.status(500).json({ message: "Erreur serveur: " + err.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { user, token } = await AuthService.login(email, password);

            return res.json({ user, token });
        } catch (err) {
            if (err.message === "INVALID_CREDENTIALS")
                return res.status(401).json({ message: "Identifiants incorrects" });

            return res.status(500).json({ message: "Erreur serveur" });
        }
    },

    async me(req, res) {     // ← très important !
        return res.json({ user: req.user });
    }
};

module.exports = AuthController;
