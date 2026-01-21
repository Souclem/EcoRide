const AuthService = require("../services/auth.services");

const AuthController = {
    async register(req, res) {
        try {
            const { email, name, last_name, password, language } = req.body;
            console.log("📝 Tentative d'inscription:", { email, name, last_name, language });


            const errors = [];

            // 1. Validation des champs obligatoires
            if (!name || name.trim() === '') {
                errors.push("Le prénom est obligatoire");
            }

            if (!last_name || last_name.trim() === '') {
                errors.push("Le nom est obligatoire");
            }

            if (!email || email.trim() === '') {
                errors.push("L'email est obligatoire");
            }

            if (!password) {
                errors.push("Le mot de passe est obligatoire");
            }

            // 2. Validation du format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !emailRegex.test(email)) {
                errors.push("Format d'email invalide");
            }

            // 3. Validation longueur email (max 255 pour la DB)
            if (email && email.length > 255) {
                errors.push("L'email ne peut pas dépasser 255 caractères");
            }

            // 4. Validation du mot de passe
            if (password && password.length < 6) {
                errors.push("Le mot de passe doit contenir au moins 6 caractères");
            }

            if (password && password.length > 255) {
                errors.push("Le mot de passe ne peut pas dépasser 255 caractères");
            }

            // 5. Validation des noms (max 100 pour la DB)
            if (name && name.length > 100) {
                errors.push("Le prénom ne peut pas dépasser 100 caractères");
            }

            if (last_name && last_name.length > 100) {
                errors.push("Le nom ne peut pas dépasser 100 caractères");
            }

            // 6. Validation de la langue (optionnelle mais doit être valide si fournie)
            if (language && !['fr', 'en'].includes(language)) {
                errors.push("Langue invalide (fr ou en uniquement)");
            }

            // Retourner les erreurs s'il y en a
            if (errors.length > 0) {
                return res.status(400).json({
                    message: "Validation échouée",
                    errors: errors
                });
            }

            // ===========================
            // Toutes les validations OK → Créer l'utilisateur
            // ===========================

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

            const errors = [];

            // 1. Validation des champs obligatoires
            if (!email || email.trim() === '') {
                errors.push("L'email est obligatoire");
            }

            if (!password) {
                errors.push("Le mot de passe est obligatoire");
            }

            // 2. Validation basique du format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !emailRegex.test(email)) {
                errors.push("Format d'email invalide");
            }

            // Retourner les erreurs s'il y en a
            if (errors.length > 0) {
                return res.status(400).json({
                    message: "Validation échouée",
                    errors: errors
                });
            }

            // ===========================
            // Toutes les validations OK → Tenter la connexion
            // ===========================

            const { user, token } = await AuthService.login(email, password);

            return res.json({ user, token });
        } catch (err) {
            if (err.message === "INVALID_CREDENTIALS")
                return res.status(401).json({ message: "Identifiants incorrects" });
            return res.status(500).json({ message: "Erreur serveur: " + err.message });
        }
    }
};

module.exports = AuthController;
