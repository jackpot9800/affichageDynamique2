-- Script 7: Données de test (OPTIONNEL)
-- Exécutez ce script seulement si vous voulez des données de test

USE carousel_db;

-- Insérer une présentation de test
INSERT IGNORE INTO presentations (id, name, description) VALUES 
(1, 'Présentation de démonstration', 'Une présentation de test pour valider le fonctionnement de l\'application Fire TV');

-- Insérer des slides de test
INSERT IGNORE INTO slides (id, name, title, image_path, media_path) VALUES 
(1, 'Slide d\'accueil', 'Bienvenue', 'uploads/slides/slide-1.jpg', 'uploads/slides/slide-1.jpg'),
(2, 'Slide informations', 'Nos services', 'uploads/slides/slide-2.jpg', 'uploads/slides/slide-2.jpg'),
(3, 'Slide contact', 'Contactez-nous', 'uploads/slides/slide-3.jpg', 'uploads/slides/slide-3.jpg');

-- Lier les slides à la présentation avec des durées spécifiques
INSERT IGNORE INTO presentation_slides (presentation_id, slide_id, position, duration, transition_type) VALUES 
(1, 1, 1, 8, 'fade'),
(1, 2, 2, 6, 'slide'),
(1, 3, 3, 10, 'fade');

-- Afficher confirmation
SELECT 'Données de test insérées avec succès!' as message;

-- Vérifier les données
SELECT 
    p.name as presentation_name,
    COUNT(ps.slide_id) as slide_count,
    SUM(ps.duration) as total_duration_seconds
FROM presentations p
LEFT JOIN presentation_slides ps ON p.id = ps.presentation_id
WHERE p.id = 1
GROUP BY p.id, p.name;