-- Script 9: Nettoyage et réinitialisation (ATTENTION!)
-- N'exécutez ce script QUE si vous voulez SUPPRIMER toutes les données

USE carousel_db;

-- ATTENTION: Ce script supprime TOUTES les données!
-- Décommentez les lignes ci-dessous seulement si vous êtes sûr

/*
-- Désactiver les vérifications de clés étrangères temporairement
SET FOREIGN_KEY_CHECKS = 0;

-- Vider toutes les tables
TRUNCATE TABLE presentation_displays;
TRUNCATE TABLE presentation_slides;
TRUNCATE TABLE displays;
TRUNCATE TABLE slides;
TRUNCATE TABLE presentations;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Réinitialiser les auto-increment
ALTER TABLE presentations AUTO_INCREMENT = 1;
ALTER TABLE slides AUTO_INCREMENT = 1;
ALTER TABLE presentation_slides AUTO_INCREMENT = 1;
ALTER TABLE displays AUTO_INCREMENT = 1;
ALTER TABLE presentation_displays AUTO_INCREMENT = 1;

SELECT 'Toutes les données ont été supprimées et les compteurs réinitialisés!' as message;
*/

SELECT 'Script de nettoyage prêt (décommentez pour exécuter)' as message;