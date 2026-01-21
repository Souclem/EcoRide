const express = require("express");
const AuthController = require("../controllers/auth.controller");

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post("/register", AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur existant
 * @access  Public
 */
router.post("/login", AuthController.login);

module.exports = router;
