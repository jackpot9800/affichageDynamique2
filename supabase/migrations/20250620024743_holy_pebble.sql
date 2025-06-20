-- Script 8: Vérification de la structure complète
-- Exécutez ce script pour vérifier que tout est correct

USE carousel_db;

-- Afficher toutes les tables
SHOW TABLES;

-- Vérifier les contraintes de clés étrangères
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'carousel_db'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Vérifier les index
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'carousel_db'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Compter les enregistrements dans chaque table
SELECT 'presentations' as table_name, COUNT(*) as record_count FROM presentations
UNION ALL
SELECT 'slides' as table_name, COUNT(*) as record_count FROM slides
UNION ALL
SELECT 'presentation_slides' as table_name, COUNT(*) as record_count FROM presentation_slides
UNION ALL
SELECT 'displays' as table_name, COUNT(*) as record_count FROM displays
UNION ALL
SELECT 'presentation_displays' as table_name, COUNT(*) as record_count FROM presentation_displays;

-- Afficher confirmation finale
SELECT 'Structure de base de données vérifiée avec succès!' as message;