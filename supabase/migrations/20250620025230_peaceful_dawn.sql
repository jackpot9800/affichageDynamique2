-- Script 10: Nettoyage et réinitialisation (ATTENTION!)
-- ⚠️ DÉCOMMENTEZ SEULEMENT LES LIGNES QUE VOUS VOULEZ EXÉCUTER ⚠️

USE affichageDynamique;

-- ATTENTION: Ces commandes vont SUPPRIMER toutes les données!
-- Décommentez seulement si vous voulez vraiment tout effacer

/*
-- Supprimer toutes les données (mais garder les tables)
DELETE FROM logs_activite;
DELETE FROM diffusions;
DELETE FROM presentation_medias;
DELETE FROM medias;
DELETE FROM presentations;
DELETE FROM appareils;

-- Remettre les compteurs auto-increment à 1
ALTER TABLE presentations AUTO_INCREMENT = 1;
ALTER TABLE medias AUTO_INCREMENT = 1;
ALTER TABLE presentation_medias AUTO_INCREMENT = 1;
ALTER TABLE appareils AUTO_INCREMENT = 1;
ALTER TABLE diffusions AUTO_INCREMENT = 1;
ALTER TABLE logs_activite AUTO_INCREMENT = 1;
*/

/*
-- Supprimer complètement toutes les tables
DROP TABLE IF EXISTS logs_activite;
DROP TABLE IF EXISTS diffusions;
DROP TABLE IF EXISTS presentation_medias;
DROP TABLE IF EXISTS medias;
DROP TABLE IF EXISTS presentations;
DROP TABLE IF EXISTS appareils;
*/

/*
-- Supprimer complètement la base de données
DROP DATABASE IF EXISTS affichageDynamique;
*/

SELECT 'Script de nettoyage prêt (décommentez les lignes pour exécuter)' as message;