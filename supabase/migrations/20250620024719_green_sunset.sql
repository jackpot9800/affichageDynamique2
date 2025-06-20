-- Script 2: Table des présentations
-- Exécutez ce script dans HeidiSQL après avoir sélectionné la base carousel_db

USE carousel_db;

-- Table des présentations
CREATE TABLE IF NOT EXISTS presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour améliorer les performances
    INDEX idx_presentations_created_at (created_at),
    INDEX idx_presentations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table presentations créée avec succès!' as message;
DESCRIBE presentations;