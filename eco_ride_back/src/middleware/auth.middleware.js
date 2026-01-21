const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/user.repository");
require("dotenv").config();

// Middleware de vérification du token JWT
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token requis." });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        req.userId = decoded.id; // Ajouter userId pour faciliter l'accès
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token invalide." });
    }
};

// Middleware factory pour vérifier les rôles
// Utilisation : router.post("/", auth, requireRole('marketer', 'admin'), controller.create)
const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Récupérer l'utilisateur complet depuis la base de données
            const user = await UserRepository.findById(req.userId);

            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé." });
            }

            // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
                    required: allowedRoles,
                    current: user.role
                });
            }

            // Attacher l'utilisateur complet à la requête pour éviter une autre requête DB
            req.userFull = user;
            next();
        } catch (error) {
            console.error("Erreur lors de la vérification du rôle:", error);
            return res.status(500).json({ message: "Erreur serveur lors de la vérification des permissions." });
        }
    };
};

module.exports = {
    auth,
    requireRole
};
