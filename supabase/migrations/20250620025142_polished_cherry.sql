-- Script 2: Table des présentations
-- Exécutez ce script dans HeidiSQL après avoir sélectionné la base affichageDynamique

USE affichageDynamique;

-- Table des présentations
CREATE TABLE IF NOT EXISTS presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    statut ENUM('actif', 'inactif', 'brouillon') DEFAULT 'actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    duree_totale INT DEFAULT 0 COMMENT 'Durée totale en secondes',
    nombre_slides INT DEFAULT 0,
    
    -- Index pour améliorer les performances
    INDEX idx_presentations_date_creation (date_creation),
    INDEX idx_presentations_nom (nom),
    INDEX idx_presentations_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table presentations créée avec succès!' as message;
DESCRIBE presentations;