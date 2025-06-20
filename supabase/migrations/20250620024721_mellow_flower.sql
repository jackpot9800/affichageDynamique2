-- Script 3: Table des slides
-- Exécutez ce script dans HeidiSQL

USE carousel_db;

-- Table des slides
CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    image_path VARCHAR(500) NOT NULL,
    media_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour améliorer les performances
    INDEX idx_slides_name (name),
    INDEX idx_slides_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table slides créée avec succès!' as message;
DESCRIBE slides;