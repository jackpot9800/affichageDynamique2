-- Script 8: Données de test (OPTIONNEL)
-- Exécutez ce script seulement si vous voulez des données de test

USE affichageDynamique;

-- Insérer une présentation de test
INSERT IGNORE INTO presentations (id, nom, description, statut) VALUES 
(1, 'Présentation de démonstration Fire TV', 'Une présentation de test pour valider le fonctionnement de l\'application Fire TV Enhanced', 'actif');

-- Insérer des médias de test
INSERT IGNORE INTO medias (id, nom, titre, type_media, chemin_fichier, statut) VALUES 
(1, 'Slide d\'accueil', 'Bienvenue sur Fire TV', 'image', 'uploads/medias/slide-accueil.jpg', 'actif'),
(2, 'Slide informations', 'Nos services premium', 'image', 'uploads/medias/slide-services.jpg', 'actif'),
(3, 'Slide contact', 'Contactez notre équipe', 'image', 'uploads/medias/slide-contact.jpg', 'actif'),
(4, 'Vidéo de présentation', 'Vidéo corporate', 'video', 'uploads/medias/video-corporate.mp4', 'actif');

-- Lier les médias à la présentation avec des durées spécifiques
INSERT IGNORE INTO presentation_medias (presentation_id, media_id, ordre_affichage, duree_affichage, effet_transition) VALUES 
(1, 1, 1, 8, 'fade'),
(1, 2, 2, 6, 'slide'),
(1, 3, 3, 10, 'fade'),
(1, 4, 4, 15, 'fade');

-- Mettre à jour les statistiques de la présentation
UPDATE presentations 
SET nombre_slides = 4, duree_totale = 39 
WHERE id = 1;

-- Insérer un appareil de test
INSERT IGNORE INTO appareils (id, nom, type_appareil, identifiant_unique, statut, presentation_defaut_id) VALUES 
(1, 'Fire TV Salon Principal', 'firetv', 'firetv_demo_001', 'actif', 1);

-- Afficher confirmation
SELECT 'Données de test insérées avec succès!' as message;

-- Vérifier les données
SELECT 
    p.nom as nom_presentation,
    COUNT(pm.media_id) as nombre_medias,
    SUM(pm.duree_affichage) as duree_totale_secondes,
    CONCAT(FLOOR(SUM(pm.duree_affichage)/60), 'm ', MOD(SUM(pm.duree_affichage), 60), 's') as duree_formatee
FROM presentations p
LEFT JOIN presentation_medias pm ON p.id = pm.presentation_id
WHERE p.id = 1
GROUP BY p.id, p.nom;