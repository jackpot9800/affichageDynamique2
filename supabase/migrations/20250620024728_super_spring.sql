-- Script 5: Table des appareils (displays)
-- Exécutez ce script dans HeidiSQL

USE carousel_db;

-- Table des appareils connectés
CREATE TABLE IF NOT EXISTS displays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'android',
    device_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active TINYINT(1) DEFAULT 1,
    capabilities JSON,
    location VARCHAR(255),
    group_name VARCHAR(255),
    default_display_presentation_id INT DEFAULT 0,
    
    -- Index pour améliorer les performances
    INDEX idx_displays_device_id (device_id),
    INDEX idx_displays_device_type (device_type),
    INDEX idx_displays_last_seen (last_seen),
    INDEX idx_displays_active (active),
    INDEX idx_displays_default_presentation (default_display_presentation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table displays créée avec succès!' as message;
DESCRIBE displays;