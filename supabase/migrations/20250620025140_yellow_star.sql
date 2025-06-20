-- Script 1: Création de la base de données affichageDynamique
-- Exécutez ce script en premier dans HeidiSQL

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS affichageDynamique 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE affichageDynamique;

-- Afficher confirmation
SELECT 'Base de données affichageDynamique créée avec succès!' as message;