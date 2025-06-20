-- Script 5: Table des appareils connectés
-- Exécutez ce script dans HeidiSQL

USE affichageDynamique;

-- Table des appareils connectés (remplace displays)
CREATE TABLE IF NOT EXISTS appareils (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type_appareil VARCHAR(50) NOT NULL DEFAULT 'firetv',
    identifiant_unique VARCHAR(255) UNIQUE NOT NULL,
    adresse_ip VARCHAR(45),
    derniere_connexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date_enregistrement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    statut ENUM('actif', 'inactif', 'maintenance') DEFAULT 'actif',
    capacites JSON,
    localisation VARCHAR(255),
    groupe_appareil VARCHAR(255),
    presentation_defaut_id INT DEFAULT 0,
    resolution_ecran VARCHAR(20) DEFAULT '1920x1080',
    version_app VARCHAR(20),
    
    -- Index pour améliorer les performances
    INDEX idx_appareils_identifiant (identifiant_unique),
    INDEX idx_appareils_type (type_appareil),
    INDEX idx_appareils_derniere_connexion (derniere_connexion),
    INDEX idx_appareils_statut (statut),
    INDEX idx_appareils_presentation_defaut (presentation_defaut_id),
    INDEX idx_appareils_groupe (groupe_appareil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table appareils créée avec succès!' as message;
DESCRIBE appareils;