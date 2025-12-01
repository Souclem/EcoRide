-- ===========================
-- ECORIDE DATABASE SCHEMA
-- Complete database reset and creation
-- ===========================

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- ===========================
-- DROP ALL TABLES IF THEY EXIST
-- ===========================
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS eligible_related;
DROP TABLE IF EXISTS trip_links;
DROP TABLE IF EXISTS prefer;
DROP TABLE IF EXISTS subscription_user;
DROP TABLE IF EXISTS promotions_translations;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS plans_subscription_translations;
DROP TABLE IF EXISTS plans_subscription;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS useru;
DROP TABLE IF EXISTS languages;

-- ===========================
-- TABLE: languages
-- ===========================
CREATE TABLE languages (
    code_language VARCHAR(5) PRIMARY KEY,
    name_language VARCHAR(50) NOT NULL
);

-- Add initial languages (FR + EN)
INSERT INTO languages (code_language, name_language)
VALUES
    ('fr', 'French'),
    ('en', 'English');

-- ===========================
-- TABLE: users
-- ===========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    last_name VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stripe_id VARCHAR(255),
    co2_saved INT DEFAULT 0,
    tree_planted INT DEFAULT 0,
    preferred_language VARCHAR(5),
    FOREIGN KEY (preferred_language) REFERENCES languages(code_language)
);

-- Insert test users (password: "test")
INSERT INTO users (email, password, name, role) VALUES
('test1@test.com', '$2b$10$wqh9ObSXKEEQ9GMHg3IfBuDIAch0Pt8uHrkAPy/4feieTr7JovfZK', 'Test User 1', 'user'),
('test2@test.com', '$2b$10$wqh9ObSXKEEQ9GMHg3IfBuDIAch0Pt8uHrkAPy/4feieTr7JovfZK', 'Test User 2', 'user'),
('test3@test.com', '$2b$10$wqh9ObSXKEEQ9GMHg3IfBuDIAch0Pt8uHrkAPy/4feieTr7JovfZK', 'Test User 3', 'user'),
('test4@test.com', '$2b$10$wqh9ObSXKEEQ9GMHg3IfBuDIAch0Pt8uHrkAPy/4feieTr7JovfZK', 'Test User 4', 'user');

-- ===========================
-- TABLE: plans_subscription
-- ===========================
CREATE TABLE plans_subscription (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price_cents INT NOT NULL,
    reduction_percent INT,
    multiplicator_tree INT,
    active BOOLEAN DEFAULT TRUE
);

-- ===========================
-- TABLE: plans_subscription_translations
-- ===========================
CREATE TABLE plans_subscription_translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    FOREIGN KEY (plan_id) REFERENCES plans_subscription(id),
    FOREIGN KEY (language_code) REFERENCES languages(code_language)
);

-- ===========================
-- TABLE: subscription_user
-- ===========================
CREATE TABLE subscription_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50),
    renewal_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES plans_subscription(id)
);

-- ===========================
-- TABLE: promotions
-- ===========================
CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reduction_type VARCHAR(50),
    reduction_value INT,
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE
);

-- ===========================
-- TABLE: promotions_translations
-- ===========================
CREATE TABLE promotions_translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_id INT NOT NULL,
    language_code VARCHAR(5),
    title VARCHAR(255),
    description TEXT,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (language_code) REFERENCES languages(code_language)
);

-- ===========================
-- TABLE: eligible_related (être éligible à)
-- ===========================
CREATE TABLE eligible_related (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    promotion_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

-- ===========================
-- TABLE: trips (avec coordonnées GPS)
-- ===========================
CREATE TABLE trips (
    -- Identifiant
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Conducteur
    driver_id INT NOT NULL,

    -- Adresse de départ
    start_address VARCHAR(255),
    start_latitude DECIMAL(10, 8),
    start_longitude DECIMAL(11, 8),

    -- Adresse d'arrivée
    end_address VARCHAR(255),
    end_latitude DECIMAL(10, 8),
    end_longitude DECIMAL(11, 8),

    -- Distance calculée (en km)
    distance_km DECIMAL(6, 2),

    -- Date et heure de départ
    start_date DATETIME,

    -- Tarif par siège
    price_per_seat INT,

    -- Places disponibles
    total_seats INT,
    taken_seats INT DEFAULT 0,

    -- Statut du trajet (available, full, cancelled, completed)
    status VARCHAR(50) DEFAULT 'available',

    -- Date de création
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- CO2 économisé (en grammes)
    co2 INT DEFAULT 0,

    -- Clé étrangère
    FOREIGN KEY (driver_id) REFERENCES users(id),

    -- Index pour optimiser les performances
    INDEX idx_driver (driver_id),
    INDEX idx_start_coords (start_latitude, start_longitude),
    INDEX idx_end_coords (end_latitude, end_longitude),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    INDEX idx_creation_date (creation_date)
);

-- ===========================
-- TABLE: trip_links (être lié à)
-- ===========================
CREATE TABLE trip_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    promotion_id INT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

-- ===========================
-- TABLE: bookings
-- ===========================
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    passenger_id INT NOT NULL,
    seats_booked INT NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'confirmed',
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- TABLE: payments
-- ===========================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    external_reference VARCHAR(255),
    amount_cents INT,
    status VARCHAR(50),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    stripe_id VARCHAR(255),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- ===========================
-- TABLE: prefer (préférer)
-- ===========================
CREATE TABLE prefer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_code) REFERENCES languages(code_language)
);

-- ===========================
-- TEST DATA: TRIPS
-- ===========================

-- Trajet EN COURS (départ il y a 15 minutes)
INSERT INTO trips (
    driver_id, start_address, start_latitude, start_longitude,
    end_address, end_latitude, end_longitude,
    distance_km, start_date, price_per_seat,
    total_seats, taken_seats, status, co2
) VALUES
(1, 'Paris, Gare de Lyon', 48.8447, 2.3736,
 'Lyon, Part-Dieu', 45.7604, 4.8600,
 465, DATE_SUB(NOW(), INTERVAL 15 MINUTE), 45, 3, 2, 'available', 69750);

-- Trajets À VENIR (dans les prochains jours)
INSERT INTO trips (
    driver_id, start_address, start_latitude, start_longitude,
    end_address, end_latitude, end_longitude,
    distance_km, start_date, price_per_seat,
    total_seats, taken_seats, status, co2
) VALUES
(1, 'Marseille, Vieux Port', 43.2951, 5.3688,
 'Nice, Promenade des Anglais', 43.6951, 7.2660,
 200, DATE_ADD(NOW(), INTERVAL 2 DAY), 25, 4, 1, 'available', 30000),

(2, 'Bordeaux, Place de la Bourse', 44.8404, -0.5694,
 'Toulouse, Capitole', 43.6047, 1.4442,
 245, DATE_ADD(NOW(), INTERVAL 5 DAY), 30, 3, 0, 'available', 36750),

(3, 'Lille, Grand Place', 50.6365, 3.0635,
 'Bruxelles, Grand-Place', 50.8467, 4.3525,
 120, DATE_ADD(NOW(), INTERVAL 7 DAY), 15, 3, 2, 'available', 18000);

-- Trajets PASSÉS (historique)
INSERT INTO trips (
    driver_id, start_address, start_latitude, start_longitude,
    end_address, end_latitude, end_longitude,
    distance_km, start_date, price_per_seat,
    total_seats, taken_seats, status, co2
) VALUES
(1, 'Strasbourg, Place Kléber', 48.5839, 7.7455,
 'Paris, Tour Eiffel', 48.8584, 2.2945,
 485, DATE_SUB(NOW(), INTERVAL 10 DAY), 50, 3, 3, 'completed', 72750),

(2, 'Nantes, Château des Ducs', 47.2173, -1.5534,
 'Rennes, Place de la Mairie', 48.1113, -1.6800,
 110, DATE_SUB(NOW(), INTERVAL 20 DAY), 15, 4, 2, 'completed', 16500),

(4, 'Lyon, Bellecour', 45.7579, 4.8320,
 'Grenoble, Place Victor Hugo', 45.1885, 5.7245,
 105, DATE_SUB(NOW(), INTERVAL 30 DAY), 15, 3, 3, 'completed', 15750);

-- ===========================
-- TEST DATA: BOOKINGS
-- ===========================

-- Réservations pour le trajet EN COURS (trip_id = 1)
INSERT INTO bookings (trip_id, passenger_id, seats_booked, status) VALUES
(1, 2, 1, 'confirmed'),
(1, 3, 1, 'confirmed');

-- Réservations pour trajets À VENIR
INSERT INTO bookings (trip_id, passenger_id, seats_booked, status) VALUES
(2, 4, 1, 'confirmed'),
(4, 1, 2, 'confirmed');

-- Réservations pour trajets PASSÉS
INSERT INTO bookings (trip_id, passenger_id, seats_booked, status) VALUES
(5, 2, 2, 'confirmed'),
(5, 4, 1, 'confirmed'),
(6, 1, 1, 'confirmed'),
(6, 3, 1, 'confirmed'),
(7, 1, 2, 'confirmed'),
(7, 2, 1, 'confirmed');

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================
-- SUCCESS MESSAGE
-- ===========================
SELECT 'Base de données EcoRide créée avec succès !' as message;
