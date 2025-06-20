-- Script 3: Table des médias (slides/images)
-- Exécutez ce script dans HeidiSQL

USE affichageDynamique;

-- Table des médias (remplace slides)
CREATE TABLE IF NOT EXISTS medias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    titre VARCHAR(255),
    type_media ENUM('image', 'video', 'html') DEFAULT 'image',
    chemin_fichier VARCHAR(500) NOT NULL,
    chemin_miniature VARCHAR(500),
    taille_fichier INT DEFAULT 0 COMMENT 'Taille en octets',
    largeur INT DEFAULT 0,
    hauteur INT DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('actif', 'inactif') DEFAULT 'actif',
    
    -- Index pour améliorer les performances
    INDEX idx_medias_nom (nom),
    INDEX idx_medias_type (type_media),
    INDEX idx_medias_statut (statut),
    INDEX idx_medias_date_creation (date_creation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Afficher confirmation
SELECT 'Table medias créée avec succès!' as message;
DESCRIBE medias;