-- SCRIPT DE CREATION DE LA BASE DE DONNEES VOLCANWAY

CREATE DATABASE IF NOT EXISTS volcanway_db
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE volcanway_db;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'POLICE', 'STANDARD') NOT NULL,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mis_a_jour_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    distance_km DECIMAL(5,2),
    enregistre_par INT, -- Réfère à un Administrateur
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enregistre_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS trafic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL UNIQUE,
    niveau ENUM('FLUIDE', 'RALENTI', 'SATURE', 'BLOQUE') NOT NULL DEFAULT 'FLUIDE',
    temps_retard_min INT DEFAULT 0,
    mis_a_jour_par INT, -- Réfère à la Police Routière
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (mis_a_jour_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    type_incident ENUM('ACCIDENT', 'PANNE', 'BLOCAGE', 'METEO', 'AUTRE') NOT NULL,
    description TEXT,
    statut ENUM('EN_ATTENTE', 'VALIDE', 'REJETE', 'RESOLU') NOT NULL DEFAULT 'EN_ATTENTE',
    signale_par INT, -- Conducteur ou Piéton
    valide_par INT,  -- Police Routière
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (signale_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (valide_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS alertes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    type_incident ENUM('ACCIDENT', 'PANNE', 'BLOCAGE', 'METEO', 'AUTRE') NOT NULL DEFAULT 'AUTRE',
    message VARCHAR(255) NOT NULL,
    niveau_gravite ENUM('INFO', 'IMPORTANT', 'CRITIQUE') NOT NULL DEFAULT 'IMPORTANT',
    cree_par INT NOT NULL, -- Police Routière
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (cree_par) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Insertion des utilisateurs
-- Mots de passe = 'password123' (Idéalement à hasher avec bcrypt plus tard via l'API)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Admin', 'Goma', 'admin@volcanway.com', 'password123', 'ADMIN');

-- L'admin (ID 1) ajoute les routes du quartier Les Volcans
INSERT INTO routes (nom, description, distance_km, enregistre_par) VALUES
('Rue Des Ecoles','venue principale traversant le quartier', 2.50, 1);


INSERT INTO trafic (route_id, niveau, temps_retard_min, mis_a_jour_par) VALUES
(1, 'RALENTI', 5, 2),
(2, 'FLUIDE', 0, 2),
(3, 'SATURE', 12, 2),
(4, 'FLUIDE', 0, 2);

-- Un conducteur (ID 3) signale un incident sur le Boulevard de la Lave
INSERT INTO incidents (route_id, type_incident, description, statut, signale_par) VALUES
(3, 'BLOCAGE', 'Forte concentration de véhicules au carrefour principal.', 'EN_ATTENTE', 3);

-- La police valide l'incident et crée une Alerte Majeure
UPDATE incidents SET statut = 'VALIDE', valide_par = 2 WHERE route_id = 3 AND statut = 'EN_ATTENTE';

INSERT INTO alertes (route_id, type_incident, message, niveau_gravite, cree_par) VALUES
(3, 'BLOCAGE', 'Congestion sévère sur le Boulevard de la Lave, évitez le secteur.', 'CRITIQUE', 2);
