# 📱 Guide d'installation sur Fire TV Stick

## 🔧 Préparation du Fire TV Stick

### Étape 1: Activer le mode développeur
1. **Paramètres** → **My Fire TV** → **About**
2. **Cliquez 7 fois** sur "Build" pour activer le mode développeur
3. **Retournez** → **Developer Options**
4. **Activez** :
   - ✅ ADB Debugging
   - ✅ Apps from Unknown Sources

### Étape 2: Trouver l'IP du Fire TV
1. **Paramètres** → **My Fire TV** → **About** → **Network**
2. **Notez l'adresse IP** (ex: 192.168.1.100)

## 📥 Téléchargement de votre APK

### Depuis Expo.dev
1. **Connectez-vous** sur https://expo.dev
2. **Allez** dans "Projects"
3. **Cliquez** sur votre projet "presentation-kiosk-firetv"
4. **Allez** dans "Builds"
5. **Téléchargez** l'APK (fichier .apk)

## 📲 Installation - 3 méthodes

### Méthode 1: ADB (Recommandée)
```cmd
# Exécutez le script automatique
install-sur-firetv.bat

# OU manuellement :
adb connect 192.168.1.XXX:5555
adb install presentation-kiosk.apk
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
```

### Méthode 2: Downloader App
1. **Installez** "Downloader" depuis l'Amazon Appstore sur Fire TV
2. **Uploadez** votre APK sur Google Drive ou Dropbox
3. **Obtenez** le lien de téléchargement direct
4. **Dans Downloader**, entrez l'URL et téléchargez
5. **Installez** directement depuis Downloader

### Méthode 3: Transfert réseau
1. **Installez** ES File Explorer sur Fire TV (si disponible)
2. **Partagez** le dossier contenant l'APK sur votre PC
3. **Accédez** au partage réseau depuis Fire TV
4. **Installez** l'APK

## ✅ Vérification de l'installation

### L'application devrait :
- ✅ Apparaître dans la liste des applications Fire TV
- ✅ Se lancer en mode paysage (horizontal)
- ✅ Afficher l'écran d'accueil "Kiosque de Présentations"
- ✅ Permettre la navigation avec la télécommande Fire TV
- ✅ Se connecter à votre serveur de présentations

### Navigation télécommande :
- **Flèches directionnelles** : Navigation entre les éléments
- **Bouton central (OK)** : Sélection
- **Bouton Retour** : Retour en arrière
- **Bouton Home** : Retour à l'accueil Fire TV

## 🔧 Dépannage

### Problème : "ADB non reconnu"
**Solution :**
```cmd
# Installez Android SDK Platform Tools
# Ou utilisez la méthode Downloader App
```

### Problème : "Fire TV non détecté"
**Solutions :**
- Vérifiez que Fire TV et PC sont sur le même réseau WiFi
- Redémarrez le Fire TV
- Vérifiez l'IP du Fire TV
- Autorisez la connexion ADB sur Fire TV

### Problème : "Installation failed"
**Solutions :**
- Vérifiez que "Apps from Unknown Sources" est activé
- Libérez de l'espace sur le Fire TV
- Réessayez avec une APK fraîchement téléchargée

### Problème : "Application ne démarre pas"
**Solutions :**
```cmd
# Vérifiez les logs
adb logcat | findstr "presentationkiosk"

# Relancez manuellement
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
```

## 🎯 Configuration de l'application

### Première utilisation :
1. **Lancez** l'application sur Fire TV
2. **Allez** dans l'onglet "Paramètres"
3. **Entrez** l'URL de votre serveur : `http://198.16.183.68/mods/livetv/api`
4. **Testez** la connexion
5. **Sauvegardez** la configuration

### Test des présentations :
1. **Retournez** à l'onglet "Accueil"
2. **Vérifiez** que les présentations s'affichent
3. **Cliquez** sur une présentation pour la lancer
4. **Testez** la navigation avec la télécommande

## 🎉 Félicitations !

Votre application Fire TV est maintenant :
- ✅ **Installée** et fonctionnelle
- ✅ **Optimisée** pour Fire TV Stick
- ✅ **Compatible** avec la télécommande
- ✅ **Connectée** à votre serveur de présentations
- ✅ **Prête** pour utilisation en production

L'application peut maintenant afficher vos présentations en mode kiosque sur n'importe quel écran connecté au Fire TV Stick ! 🚀