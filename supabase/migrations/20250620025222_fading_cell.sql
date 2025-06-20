-- Script 9: Vérification de la structure complète
-- Exécutez ce script pour vérifier que tout est correct

USE affichageDynamique;

-- Afficher toutes les tables
SHOW TABLES;

-- Vérifier les contraintes de clés étrangères
SELECT 
    TABLE_NAME as 'Table',
    COLUMN_NAME as 'Colonne',
    CONSTRAINT_NAME as 'Contrainte',
    REFERENCED_TABLE_NAME as 'Table_Référencée',
    REFERENCED_COLUMN_NAME as 'Colonne_Référencée'
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'affichageDynamique'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Vérifier les index
SELECT 
    TABLE_NAME as 'Table',
    INDEX_NAME as 'Index',
    COLUMN_NAME as 'Colonne',
    CASE WHEN NON_UNIQUE = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as 'Type'
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'affichageDynamique'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Compter les enregistrements dans chaque table
SELECT 'presentations' as table_name, COUNT(*) as nombre_enregistrements FROM presentations
UNION ALL
SELECT 'medias' as table_name, COUNT(*) as nombre_enregistrements FROM medias
UNION ALL
SELECT 'presentation_medias' as table_name, COUNT(*) as nombre_enregistrements FROM presentation_medias
UNION ALL
SELECT 'appareils' as table_name, COUNT(*) as nombre_enregistrements FROM appareils
UNION ALL
SELECT 'diffusions' as table_name, COUNT(*) as nombre_enregistrements FROM diffusions
UNION ALL
SELECT 'logs_activite' as table_name, COUNT(*) as nombre_enregistrements FROM logs_activite;

-- Vérifier l'espace utilisé par la base de données
SELECT 
    table_name as 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Taille_MB'
FROM information_schema.TABLES 
WHERE table_schema = 'affichageDynamique'
ORDER BY (data_length + index_length) DESC;

-- Afficher confirmation finale
SELECT 'Structure de base de données affichageDynamique vérifiée avec succès!' as message;