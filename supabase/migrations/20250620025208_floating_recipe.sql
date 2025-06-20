-- Script 7: Table des logs d'activité
-- Exécutez ce script dans HeidiSQL

USE affichageDynamique;

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS logs_activite (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_action ENUM('connexion', 'diffusion', 'erreur', 'maintenance') NOT NULL,
    appareil_id INT,
    identifiant_appareil VARCHAR(255),
    presentation_id INT,
    message TEXT,
    details JSON,
    adresse_ip VARCHAR(45),
    user_agent TEXT,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clés étrangères (optionnelles)
    FOREIGN KEY (appareil_id) REFERENCES appareils(id) ON DELETE SET NULL,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE SET NULL,
    
    -- Index pour améliorer les performances
    INDEX idx_logs_type_action (type_action),
    INDEX idx_logs_appareil_id (appareil_id),
    INDEX idx_logs_identifiant_appareil (identifiant_appareil),
    INDEX idx_logs_date_action (date_action),
    INDEX idx_logs_presentation_id (presentation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table logs_activite créée avec succès!' as message;
DESCRIBE logs_activite;