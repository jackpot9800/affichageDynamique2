-- Script SQL pour créer/mettre à jour la base de données des présentations
-- Exécutez ce script sur votre serveur MySQL

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS carousel_db;
USE carousel_db;

-- Table des présentations
CREATE TABLE IF NOT EXISTS presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des slides
CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison entre présentations et slides
CREATE TABLE IF NOT EXISTS presentation_slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    slide_id INT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 5,
    transition_type VARCHAR(50) DEFAULT 'fade',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE,
    UNIQUE KEY unique_presentation_slide (presentation_id, slide_id)
);

-- Table des appareils (displays)
CREATE TABLE IF NOT EXISTS displays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'android',
    device_id VARCHAR(100) UNIQUE NOT NULL,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vérifier si les colonnes existent et les ajouter si nécessaire
-- Ajouter la colonne duration si elle n'existe pas
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'carousel_db' 
         AND TABLE_NAME = 'presentation_slides' 
         AND COLUMN_NAME = 'duration') = 0,
        'ALTER TABLE presentation_slides ADD COLUMN duration INT NOT NULL DEFAULT 5',
        'SELECT "Column duration already exists" as message'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne transition_type si elle n'existe pas
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'carousel_db' 
         AND TABLE_NAME = 'presentation_slides' 
         AND COLUMN_NAME = 'transition_type') = 0,
        'ALTER TABLE presentation_slides ADD COLUMN transition_type VARCHAR(50) DEFAULT "fade"',
        'SELECT "Column transition_type already exists" as message'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne position si elle n'existe pas
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'carousel_db' 
         AND TABLE_NAME = 'presentation_slides' 
         AND COLUMN_NAME = 'position') = 0,
        'ALTER TABLE presentation_slides ADD COLUMN position INT NOT NULL DEFAULT 0',
        'SELECT "Column position already exists" as message'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_presentation_slides_presentation_id ON presentation_slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_slides_slide_id ON presentation_slides(slide_id);
CREATE INDEX IF NOT EXISTS idx_presentation_slides_position ON presentation_slides(presentation_id, position);
CREATE INDEX IF NOT EXISTS idx_displays_device_id ON displays(device_id);

-- Insérer des données de test (optionnel)
-- Décommentez les lignes suivantes si vous voulez des données de test

/*
-- Insérer une présentation de test
INSERT IGNORE INTO presentations (id, name, description) VALUES 
(1, 'Présentation de test', 'Une présentation de démonstration pour tester l\'application');

-- Insérer des slides de test
INSERT IGNORE INTO slides (id, name, image_path) VALUES 
(1, 'Slide 1', 'test-slide-1.jpg'),
(2, 'Slide 2', 'test-slide-2.jpg'),
(3, 'Slide 3', 'test-slide-3.jpg');

-- Lier les slides à la présentation
INSERT IGNORE INTO presentation_slides (presentation_id, slide_id, position, duration, transition_type) VALUES 
(1, 1, 1, 8, 'fade'),
(1, 2, 2, 6, 'slide'),
(1, 3, 3, 10, 'fade');
*/

-- Afficher le statut des tables créées
SELECT 'Tables créées avec succès!' as status;

-- Vérifier la structure des tables
SHOW TABLES;

-- Afficher la structure de la table presentation_slides pour vérification
DESCRIBE presentation_slides;