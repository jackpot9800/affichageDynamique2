# Scripts SQL pour la base de données affichageDynamique

## 📋 Instructions d'utilisation avec HeidiSQL

### Ordre d'exécution des scripts :

1. **01_create_database.sql** - Crée la base de données `affichageDynamique`
2. **02_create_presentations_table.sql** - Table des présentations
3. **03_create_medias_table.sql** - Table des médias (images/vidéos)
4. **04_create_presentation_medias_table.sql** - Table de liaison présentations-médias
5. **05_create_appareils_table.sql** - Table des appareils Fire TV
6. **06_create_diffusions_table.sql** - Table des diffusions (assignations)
7. **07_create_logs_table.sql** - Table des logs d'activité
8. **08_insert_test_data.sql** - Données de test (optionnel)
9. **09_verify_structure.sql** - Vérification de la structure
10. **10_cleanup_reset.sql** - Nettoyage (attention!)

### 🚀 Procédure dans HeidiSQL :

1. **Ouvrez HeidiSQL** et connectez-vous à votre serveur MySQL
2. **Exécutez les scripts dans l'ordre** en copiant-collant le contenu
3. **Vérifiez** après chaque script que tout s'est bien passé
4. **Testez** avec le script de vérification

### 📊 Structure des tables créées :

#### `presentations`
- Stocke les présentations principales
- Champs : id, nom, description, statut, date_creation, duree_totale, nombre_slides

#### `medias`
- Stocke les médias (images, vidéos, HTML)
- Champs : id, nom, titre, type_media, chemin_fichier, taille_fichier, largeur, hauteur

#### `presentation_medias`
- Lie les médias aux présentations avec ordre et durée
- Champs : presentation_id, media_id, ordre_affichage, duree_affichage, effet_transition

#### `appareils`
- Stocke les appareils Fire TV connectés
- Champs : identifiant_unique, nom, type_appareil, adresse_ip, capacites, presentation_defaut_id

#### `diffusions`
- Gère les diffusions de présentations aux appareils
- Champs : presentation_id, identifiant_appareil, lecture_automatique, mode_boucle, priorite, statut

#### `logs_activite`
- Enregistre toutes les activités du système
- Champs : type_action, appareil_id, presentation_id, message, details, date_action

### 🔧 Fonctionnalités supportées :

- ✅ **Présentations multiples** avec médias ordonnés
- ✅ **Support multi-médias** (images, vidéos, HTML)
- ✅ **Diffusions programmées** avec priorités
- ✅ **Mode auto-play et boucle** avancé
- ✅ **Présentations par défaut** par appareil
- ✅ **Logs d'activité** complets
- ✅ **Gestion des appareils** Fire TV enhanced
- ✅ **API REST complète** pour l'application mobile
- ✅ **Statuts avancés** (actif, inactif, maintenance)
- ✅ **Groupes d'appareils** et localisation
- ✅ **Statistiques de diffusion** et suivi

### 🎯 Améliorations par rapport à carousel_db :

1. **Noms en français** : Plus intuitif pour votre équipe
2. **Structure enrichie** : Plus de métadonnées et options
3. **Logs complets** : Traçabilité totale des actions
4. **Gestion des priorités** : Diffusions urgentes possibles
5. **Support multi-médias** : Pas seulement des images
6. **Statuts avancés** : Meilleur contrôle du cycle de vie
7. **Groupes d'appareils** : Organisation par zones/services
8. **Statistiques** : Nombre de lectures, durées, etc.

### 🛠️ Maintenance :

- **Sauvegarde** : Exportez régulièrement avec HeidiSQL
- **Nettoyage** : Utilisez le script 10 pour réinitialiser si nécessaire
- **Monitoring** : Surveillez la table `logs_activite` pour les erreurs
- **Performance** : Index optimisés pour les requêtes fréquentes

### 🔍 Migration depuis carousel_db :

Si vous voulez migrer vos données existantes :

```sql
-- Exemple de migration des présentations
INSERT INTO affichageDynamique.presentations (nom, description, date_creation)
SELECT name, description, created_at 
FROM carousel_db.presentations;

-- Exemple de migration des appareils
INSERT INTO affichageDynamique.appareils (nom, identifiant_unique, type_appareil, date_enregistrement)
SELECT name, device_id, device_type, created_at 
FROM carousel_db.displays;
```

### 📱 Compatibilité :

Cette nouvelle structure est optimisée pour :
- **MySQL 5.7+** ou **MariaDB 10.2+**
- **Application Fire TV Enhanced** React Native
- **API PHP moderne** avec logs et debug
- **Encodage UTF-8** complet
- **Évolutivité** pour futures fonctionnalités

### 🎉 Avantages :

- **Plus maintenable** : Noms explicites en français
- **Plus robuste** : Gestion d'erreurs et logs
- **Plus flexible** : Support de différents types de médias
- **Plus professionnel** : Statuts, priorités, groupes
- **Plus évolutif** : Structure extensible pour nouvelles fonctionnalités