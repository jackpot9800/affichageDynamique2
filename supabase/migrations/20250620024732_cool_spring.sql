-- Script 6: Table des assignations de présentations
-- Exécutez ce script dans HeidiSQL

USE carousel_db;

-- Table des assignations de présentations aux appareils
CREATE TABLE IF NOT EXISTS presentation_displays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    display_id INT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NULL DEFAULT NULL,
    end_time TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_play TINYINT(1) DEFAULT 0,
    loop_mode TINYINT(1) DEFAULT 0,
    viewed_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Clés étrangères
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    FOREIGN KEY (display_id) REFERENCES displays(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    INDEX idx_presentation_displays_presentation_id (presentation_id),
    INDEX idx_presentation_displays_display_id (display_id),
    INDEX idx_presentation_displays_device_id (device_id),
    INDEX idx_presentation_displays_created_at (created_at),
    INDEX idx_presentation_displays_active (start_time, end_time),
    
    -- Contrainte unique pour éviter les assignations multiples
    UNIQUE INDEX unique_device_assignment (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table presentation_displays créée avec succès!' as message;
DESCRIBE presentation_displays;