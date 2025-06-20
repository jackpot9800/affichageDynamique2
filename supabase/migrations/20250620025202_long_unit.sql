-- Script 6: Table des diffusions (assignations)
-- Exécutez ce script dans HeidiSQL

USE affichageDynamique;

-- Table des diffusions de présentations aux appareils
CREATE TABLE IF NOT EXISTS diffusions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    appareil_id INT NOT NULL,
    identifiant_appareil VARCHAR(255) NOT NULL,
    date_debut TIMESTAMP NULL DEFAULT NULL,
    date_fin TIMESTAMP NULL DEFAULT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lecture_automatique TINYINT(1) DEFAULT 0,
    mode_boucle TINYINT(1) DEFAULT 0,
    priorite INT DEFAULT 1 COMMENT '1=normale, 2=haute, 3=urgente',
    statut ENUM('programmee', 'active', 'terminee', 'annulee') DEFAULT 'programmee',
    date_visionnage TIMESTAMP NULL DEFAULT NULL,
    nombre_lectures INT DEFAULT 0,
    
    -- Clés étrangères
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    FOREIGN KEY (appareil_id) REFERENCES appareils(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    INDEX idx_diffusions_presentation_id (presentation_id),
    INDEX idx_diffusions_appareil_id (appareil_id),
    INDEX idx_diffusions_identifiant_appareil (identifiant_appareil),
    INDEX idx_diffusions_date_creation (date_creation),
    INDEX idx_diffusions_statut (statut),
    INDEX idx_diffusions_priorite (priorite),
    INDEX idx_diffusions_actives (date_debut, date_fin),
    
    -- Contrainte unique pour éviter les assignations multiples actives
    UNIQUE INDEX unique_diffusion_active (identifiant_appareil, statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table diffusions créée avec succès!' as message;
DESCRIBE diffusions;