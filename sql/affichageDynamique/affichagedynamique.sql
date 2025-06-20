-- --------------------------------------------------------
-- Hôte:                         192.168.18.28
-- Version du serveur:           9.3.0 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Listage des données de la table affichagedynamique.appareils : ~4 rows (environ)
INSERT INTO `appareils` (`id`, `nom`, `type_appareil`, `identifiant_unique`, `adresse_ip`, `derniere_connexion`, `date_enregistrement`, `date_modification`, `statut`, `capacites`, `localisation`, `groupe_appareil`, `presentation_defaut_id`, `resolution_ecran`, `version_app`) VALUES
	(2, 'Fire TV Stick - a8hs7029x', 'firetv', 'firetv_mc48x84n_a8hs7029x', '192.168.18.25', '2025-06-20 04:10:46', '2025-06-20 03:33:01', '2025-06-20 04:10:46', 'actif', '["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]', NULL, NULL, 1, '1920x1080', '1.0.0'),
	(6, 'Fire TV Stick - 9x8tl85ix', 'firetv', 'firetv_mc4b5uj1_9x8tl85ix', '192.168.18.25', '2025-06-20 04:38:38', '2025-06-20 04:27:32', '2025-06-20 04:38:38', 'actif', '["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]', NULL, NULL, 1, '1920x1080', '1.0.0'),
	(8, 'Fire TV Stick - fjvg7m2wc', 'firetv', 'firetv_mc4cs2tv_fjvg7m2wc', '192.168.18.25', '2025-06-20 05:59:39', '2025-06-20 05:15:51', '2025-06-20 05:59:39', 'actif', '["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]', NULL, NULL, 1, '1920x1080', '1.0.0'),
	(11, 'Fire TV Stick - qs0ovnx3f', 'firetv', 'firetv_mc2w9zll_qs0ovnx3f', '192.168.18.8', '2025-06-20 14:55:28', '2025-06-20 14:55:10', '2025-06-20 14:55:28', 'actif', '["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]', NULL, NULL, 1, '1920x1080', '1.0.0');

-- Listage des données de la table affichagedynamique.diffusions : ~0 rows (environ)

-- Listage des données de la table affichagedynamique.logs_activite : ~0 rows (environ)
INSERT INTO `logs_activite` (`id`, `type_action`, `appareil_id`, `identifiant_appareil`, `presentation_id`, `message`, `details`, `adresse_ip`, `user_agent`, `date_action`) VALUES
	(1, 'connexion', 2, 'firetv_mc48x84n_a8hs7029x', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - a8hs7029x", "type": "firetv", "platform": "android", "device_id": "firetv_mc48x84n_a8hs7029x", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 03:33:01'),
	(2, 'connexion', 2, 'firetv_mc48x84n_a8hs7029x', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - a8hs7029x", "type": "firetv", "platform": "android", "device_id": "firetv_mc48x84n_a8hs7029x", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 03:43:41'),
	(3, 'connexion', 2, 'firetv_mc48x84n_a8hs7029x', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - a8hs7029x", "type": "firetv", "platform": "android", "device_id": "firetv_mc48x84n_a8hs7029x", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 03:56:07'),
	(4, 'connexion', 2, 'firetv_mc48x84n_a8hs7029x', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - a8hs7029x", "type": "firetv", "platform": "android", "device_id": "firetv_mc48x84n_a8hs7029x", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 04:10:46'),
	(5, 'connexion', 6, 'firetv_mc4b5uj1_9x8tl85ix', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - 9x8tl85ix", "type": "firetv", "platform": "android", "device_id": "firetv_mc4b5uj1_9x8tl85ix", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 04:27:32'),
	(6, 'connexion', 6, 'firetv_mc4b5uj1_9x8tl85ix', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - 9x8tl85ix", "type": "firetv", "platform": "android", "device_id": "firetv_mc4b5uj1_9x8tl85ix", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 04:38:38'),
	(7, 'connexion', 8, 'firetv_mc4cs2tv_fjvg7m2wc', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - fjvg7m2wc", "type": "firetv", "platform": "android", "device_id": "firetv_mc4cs2tv_fjvg7m2wc", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 05:15:51'),
	(8, 'connexion', 8, 'firetv_mc4cs2tv_fjvg7m2wc', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - fjvg7m2wc", "type": "firetv", "platform": "android", "device_id": "firetv_mc4cs2tv_fjvg7m2wc", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 05:58:56'),
	(9, 'connexion', 8, 'firetv_mc4cs2tv_fjvg7m2wc', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - fjvg7m2wc", "type": "firetv", "platform": "android", "device_id": "firetv_mc4cs2tv_fjvg7m2wc", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.25', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 05:59:39'),
	(10, 'connexion', 11, 'firetv_mc2w9zll_qs0ovnx3f', NULL, 'Appareil enregistré avec succès', '{"name": "Fire TV Stick - qs0ovnx3f", "type": "firetv", "platform": "android", "device_id": "firetv_mc2w9zll_qs0ovnx3f", "user_agent": "PresentationKiosk/2.0 (Android; FireTV)", "capabilities": ["video_playback", "image_display", "remote_control", "presentation_mode", "fullscreen", "auto_play", "loop_mode"]}', '192.168.18.8', 'PresentationKiosk/2.0 (Android; FireTV)', '2025-06-20 14:55:10');

-- Listage des données de la table affichagedynamique.medias : ~4 rows (environ)
INSERT INTO `medias` (`id`, `nom`, `titre`, `type_media`, `chemin_fichier`, `chemin_miniature`, `taille_fichier`, `largeur`, `hauteur`, `date_creation`, `statut`) VALUES
	(1, 'Slide d\'accueil', 'Bienvenue sur Fire TV', 'image', 'uploads/slides/slide_684b74019fb13.jpg', NULL, 0, 0, 0, '2025-06-20 02:56:26', 'actif'),
	(2, 'Slide informations', 'Nos services premium', 'image', 'uploads/slides/slide_684b3533c6fe0.jpg', NULL, 0, 0, 0, '2025-06-20 02:56:26', 'actif'),
	(3, 'Slide contact', 'Contactez notre équipe', 'image', 'uploads/slides/slide_684b2cb34e583.png', '', 304642, 1328, 848, '2025-06-20 02:56:26', 'actif'),
	(4, 'Vidéo de présentation', 'Vidéo corporate', 'video', 'uploads/slides/slide_684b3533c6fe0.jpg', NULL, 0, 0, 0, '2025-06-20 02:56:26', 'actif');

-- Listage des données de la table affichagedynamique.presentations : ~1 rows (environ)
INSERT INTO `presentations` (`id`, `nom`, `description`, `statut`, `date_creation`, `date_modification`, `duree_totale`, `nombre_slides`) VALUES
	(1, 'Présentation de démonstration Fire TV', 'Une présentation de test pour valider le fonctionnement de l\'application Fire TV Enhanced', 'actif', '2025-06-20 02:56:26', '2025-06-20 05:56:22', 120, 4);

-- Listage des données de la table affichagedynamique.presentation_medias : ~4 rows (environ)
INSERT INTO `presentation_medias` (`id`, `presentation_id`, `media_id`, `ordre_affichage`, `duree_affichage`, `effet_transition`, `date_ajout`) VALUES
	(1, 1, 1, 1, 20, 'fade', '2025-06-20 02:56:26'),
	(2, 1, 2, 2, 6, 'slide', '2025-06-20 02:56:26'),
	(3, 1, 3, 3, 10, 'fade', '2025-06-20 02:56:26'),
	(4, 1, 4, 4, 15, 'fade', '2025-06-20 02:56:26');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
