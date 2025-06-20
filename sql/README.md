# Scripts SQL pour l'application Presentation Kiosk

## 📋 Instructions d'utilisation avec HeidiSQL

### Ordre d'exécution des scripts :

1. **01_create_database.sql** - Crée la base de données `carousel_db`
2. **02_create_presentations_table.sql** - Table des présentations
3. **03_create_slides_table.sql** - Table des slides/images
4. **04_create_presentation_slides_table.sql** - Table de liaison présentations-slides
5. **05_create_displays_table.sql** - Table des appareils Fire TV
6. **06_create_presentation_displays_table.sql** - Table des assignations
7. **07_insert_test_data.sql** - Données de test (optionnel)
8. **08_verify_structure.sql** - Vérification de la structure
9. **09_cleanup_and_reset.sql** - Nettoyage (attention!)

### 🚀 Procédure dans HeidiSQL :

1. **Ouvrez HeidiSQL** et connectez-vous à votre serveur MySQL
2. **Exécutez les scripts dans l'ordre** en copiant-collant le contenu
3. **Vérifiez** après chaque script que tout s'est bien passé
4. **Testez** avec le script de vérification

### 📊 Structure des tables créées :

#### `presentations`
- Stocke les présentations principales
- Champs : id, name, description, created_at, updated_at

#### `slides`
- Stocke les slides individuelles
- Champs : id, name, title, image_path, media_path, created_at

#### `presentation_slides`
- Lie les slides aux présentations avec ordre et durée
- Champs : presentation_id, slide_id, position, duration, transition_type

#### `displays`
- Stocke les appareils Fire TV connectés
- Champs : device_id, name, device_type, capabilities, default_display_presentation_id

#### `presentation_displays`
- Gère les assignations de présentations aux appareils
- Champs : presentation_id, device_id, auto_play, loop_mode, start_time, end_time

### 🔧 Fonctionnalités supportées :

- ✅ **Présentations multiples** avec slides ordonnées
- ✅ **Durées personnalisées** par slide
- ✅ **Assignations automatiques** aux appareils
- ✅ **Mode auto-play et boucle**
- ✅ **Présentations par défaut** par appareil
- ✅ **Suivi des vues** et statistiques
- ✅ **Gestion des appareils** Fire TV
- ✅ **API complète** pour l'application mobile

### 🛠️ Maintenance :

- **Sauvegarde** : Exportez régulièrement la base avec HeidiSQL
- **Nettoyage** : Utilisez le script 09 pour réinitialiser si nécessaire
- **Monitoring** : Surveillez la table `displays` pour les appareils actifs

### 🔍 Dépannage :

Si vous avez des erreurs :
1. Vérifiez que MySQL est démarré
2. Vérifiez les permissions de votre utilisateur MySQL
3. Exécutez le script de vérification (08)
4. Consultez les logs MySQL pour plus de détails

### 📱 Compatibilité :

Ces tables sont optimisées pour :
- **MySQL 5.7+** ou **MariaDB 10.2+**
- **Application Fire TV** React Native
- **API PHP** avec PDO
- **Encodage UTF-8** pour les caractères spéciaux