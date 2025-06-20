-- Script 4: Table de liaison présentations-slides
-- Exécutez ce script dans HeidiSQL

USE carousel_db;

-- Table de liaison entre présentations et slides
CREATE TABLE IF NOT EXISTS presentation_slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    slide_id INT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 5,
    transition_type VARCHAR(50) DEFAULT 'fade',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    INDEX idx_presentation_slides_presentation_id (presentation_id),
    INDEX idx_presentation_slides_slide_id (slide_id),
    INDEX idx_presentation_slides_position (presentation_id, position),
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE KEY unique_presentation_slide (presentation_id, slide_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table presentation_slides créée avec succès!' as message;
DESCRIBE presentation_slides;