# 📱 Guide complet : Export ZIP → APK sous Windows

## 🎯 Processus complet de A à Z

### Étape 1: Téléchargement et préparation
1. **Téléchargez le ZIP** depuis Bolt
2. **Extrayez** dans un dossier (ex: `C:\projets\presentation-kiosk`)
3. **Ouvrez PowerShell** en tant qu'administrateur
4. **Naviguez** vers le dossier : `cd C:\projets\presentation-kiosk`

### Étape 2: Réparation du projet
```cmd
# Exécutez le script de réparation
fix-project-windows.bat

# OU manuellement :
rmdir /s /q node_modules
del package-lock.json
npm install
npx expo start --clear
```

### Étape 3: Vérification que ça fonctionne
1. L'application s'ouvre dans le navigateur
2. Vous voyez "Kiosque de Présentations" (pas d'écran blanc)
3. Les onglets en bas fonctionnent
4. Aucune erreur dans la console (F12)

## 🏗️ Compilation APK - 3 méthodes

### Méthode 1: EAS Build (Cloud) - ⭐ RECOMMANDÉE
```cmd
# Installation d'EAS CLI
npm install -g @expo/eas-cli

# Connexion à Expo
eas login

# Configuration (première fois)
eas build:configure

# Build APK
eas build --platform android --profile production
```

**Avantages :**
- ✅ Pas besoin d'Android Studio
- ✅ Build dans le cloud
- ✅ APK téléchargeable directement
- ✅ Fonctionne sur tous les PC

### Méthode 2: Build local avec émulateur
```cmd
# Prérequis : Android Studio installé
npx expo run:android --no-install --no-bundler
```

**Prérequis :**
- Android Studio installé
- Émulateur Android ou Fire TV connecté

### Méthode 3: Export vers Android Studio
```cmd
# Générer le projet Android natif
npx expo prebuild --platform android

# Puis ouvrir le dossier android/ dans Android Studio
```

## 🔧 Installation Android Studio (Windows)

### Téléchargement et installation
1. **Téléchargez** : https://developer.android.com/studio
2. **Installez** avec les composants par défaut
3. **Lancez** Android Studio
4. **Suivez** l'assistant de configuration

### Configuration des variables d'environnement
1. **Ouvrez** les Paramètres système avancés
2. **Variables d'environnement** → **Nouveau**
3. **Ajoutez** :
   ```
   ANDROID_HOME = C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   ```
4. **Modifiez Path** et ajoutez :
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\emulator
   ```

### Vérification
```cmd
# Testez dans PowerShell
adb version
emulator -list-avds
```

## 📱 Création d'un émulateur Fire TV

### Dans Android Studio
1. **Tools** → **AVD Manager**
2. **Create Virtual Device**
3. **TV** → **Android TV (1080p)**
4. **Sélectionnez** une image système (API 30+)
5. **Nommez** : `FireTV_Emulator`
6. **Finish**

### Démarrage de l'émulateur
```cmd
# Lister les émulateurs
emulator -list-avds

# Démarrer l'émulateur
emulator -avd FireTV_Emulator
```

## 🔥 Configuration Fire TV physique

### Activation du mode développeur
1. **Paramètres** → **My Fire TV** → **About**
2. **Cliquez 7 fois** sur "Build"
3. **Retournez** → **Developer Options**
4. **Activez** :
   - ADB Debugging
   - Apps from Unknown Sources

### Connexion depuis Windows
```cmd
# Trouvez l'IP du Fire TV
# Paramètres → My Fire TV → About → Network

# Connectez-vous (remplacez l'IP)
adb connect 192.168.1.XXX:5555

# Vérifiez la connexion
adb devices
```

## 🏗️ Compilation APK dans Android Studio

### Ouverture du projet
1. **Générez** le projet Android : `npx expo prebuild --platform android`
2. **Ouvrez** Android Studio
3. **Open existing project** → Sélectionnez le dossier `android/`

### Création du keystore (signature)
1. **Build** → **Generate Signed Bundle/APK**
2. **APK** → **Create new keystore**
3. **Remplissez** les informations :
   - Keystore path: `android/app/presentation-kiosk.keystore`
   - Password: Choisissez un mot de passe
   - Key alias: `presentation-kiosk-key`
   - Validity: 25 ans

### Build de l'APK
1. **Build** → **Generate Signed Bundle/APK**
2. **Sélectionnez** votre keystore
3. **Release** → **Finish**

**Résultat :** APK dans `android/app/build/outputs/apk/release/`

## 📲 Installation sur Fire TV

### Via ADB
```cmd
# Installez l'APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Lancez l'application
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
```

### Via Downloader App
1. **Installez** Downloader sur Fire TV (Amazon Appstore)
2. **Uploadez** votre APK sur Google Drive/Dropbox
3. **Obtenez** le lien de téléchargement direct
4. **Utilisez** Downloader pour télécharger et installer

## 🚀 Script d'automatisation Windows

### Créez `deploy-firetv.bat`
```batch
@echo off
echo 🔥 Déploiement automatique sur Fire TV Stick

set FIRE_TV_IP=192.168.1.XXX
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
set PACKAGE_NAME=com.presentationkiosk.firetv

echo 📦 Compilation de l'APK...
cd android
call gradlew assembleRelease
cd ..

echo 📱 Connexion au Fire TV...
adb connect %FIRE_TV_IP%:5555

echo 🗑️ Désinstallation ancienne version...
adb uninstall %PACKAGE_NAME%

echo ⬇️ Installation nouvelle version...
adb install %APK_PATH%

echo 🚀 Lancement de l'application...
adb shell am start -n %PACKAGE_NAME%/.MainActivity

echo ✅ Déploiement terminé!
pause
```

## 🔍 Dépannage Windows

### Problème : "adb n'est pas reconnu"
**Solution :**
```cmd
# Vérifiez les variables d'environnement
echo %ANDROID_HOME%
echo %PATH%

# Redémarrez PowerShell après modification
```

### Problème : "Émulateur ne démarre pas"
**Solutions :**
- Activez la virtualisation dans le BIOS
- Installez Intel HAXM
- Utilisez un émulateur x86_64

### Problème : "Fire TV non détecté"
**Solutions :**
```cmd
# Redémarrez ADB
adb kill-server
adb start-server

# Vérifiez le firewall Windows
# Autorisez ADB dans le pare-feu
```

### Problème : "Build failed"
**Solutions :**
```cmd
# Nettoyez le projet
cd android
gradlew clean
gradlew assembleRelease

# Augmentez la mémoire Gradle
echo org.gradle.jvmargs=-Xmx4g >> android\gradle.properties
```

## 📋 Checklist finale

- [ ] ✅ Projet téléchargé et extrait
- [ ] ✅ Script de réparation exécuté
- [ ] ✅ Application fonctionne en web (pas d'écran blanc)
- [ ] ✅ Android Studio installé (si build local)
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ Fire TV en mode développeur
- [ ] ✅ ADB connecté au Fire TV
- [ ] ✅ APK compilé et signé
- [ ] ✅ APK installé sur Fire TV
- [ ] ✅ Application testée et fonctionnelle

## 🎉 Résultat final

Vous obtiendrez un fichier APK optimisé pour Fire TV Stick :
- **Taille** : ~15-25 MB
- **Compatible** : Fire TV Stick, Android TV, tablettes Android
- **Fonctionnalités** : Navigation télécommande, mode paysage, plein écran

L'APK peut être distribué et installé sur d'autres Fire TV Sticks sans Android Studio ! 🚀