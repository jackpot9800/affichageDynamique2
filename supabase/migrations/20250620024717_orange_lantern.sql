-- Script 1: Création de la base de données
-- Exécutez ce script en premier dans HeidiSQL

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS carousel_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE carousel_db;

-- Afficher confirmation
SELECT 'Base de données carousel_db créée avec succès!' as message;