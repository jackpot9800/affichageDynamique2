-- Script 4: Table de liaison présentations-médias
-- Exécutez ce script dans HeidiSQL

USE affichageDynamique;

-- Table de liaison entre présentations et médias
CREATE TABLE IF NOT EXISTS presentation_medias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    media_id INT NOT NULL,
    ordre_affichage INT NOT NULL DEFAULT 0,
    duree_affichage INT NOT NULL DEFAULT 5 COMMENT 'Durée en secondes',
    effet_transition VARCHAR(50) DEFAULT 'fade',
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES medias(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    INDEX idx_presentation_medias_presentation_id (presentation_id),
    INDEX idx_presentation_medias_media_id (media_id),
    INDEX idx_presentation_medias_ordre (presentation_id, ordre_affichage),
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE KEY unique_presentation_media (presentation_id, media_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table presentation_medias créée avec succès!' as message;
DESCRIBE presentation_medias;