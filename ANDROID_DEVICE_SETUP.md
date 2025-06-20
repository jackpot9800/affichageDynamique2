# 🔧 Configuration des appareils Android pour le build

## 🚨 Erreur actuelle
```
CommandError: No Android connected device found, and no emulators could be started automatically.
```

## 🎯 Solutions disponibles

### Solution 1: Utiliser un émulateur Android (Recommandé)

#### Étape 1: Installer Android Studio
1. Téléchargez Android Studio depuis https://developer.android.com/studio
2. Installez-le avec les composants par défaut
3. Lancez Android Studio et suivez l'assistant de configuration

#### Étape 2: Créer un émulateur
1. Dans Android Studio, allez dans **Tools** → **AVD Manager**
2. Cliquez sur **Create Virtual Device**
3. Sélectionnez **TV** → **Android TV (1080p)**
4. Choisissez une image système (API 30+ recommandé)
5. Nommez votre émulateur "FireTV_Emulator"
6. Cliquez sur **Finish**

#### Étape 3: Démarrer l'émulateur
```bash
# Lister les émulateurs disponibles
emulator -list-avds

# Démarrer l'émulateur
emulator -avd FireTV_Emulator
```

#### Étape 4: Relancer le build
```bash
# Une fois l'émulateur démarré
npx expo run:android --no-install --no-bundler
```

### Solution 2: Connecter un appareil physique

#### Pour Fire TV Stick:
1. **Paramètres** → **My Fire TV** → **About**
2. Cliquez 7 fois sur **Build** pour activer le mode développeur
3. **Paramètres** → **My Fire TV** → **Developer Options**
4. Activez **ADB Debugging**
5. Notez l'adresse IP du Fire TV

```bash
# Connecter le Fire TV via WiFi
adb connect 192.168.1.XXX:5555

# Vérifier la connexion
adb devices

# Relancer le build
npx expo run:android --no-install --no-bundler
```

#### Pour téléphone/tablette Android:
1. **Paramètres** → **À propos du téléphone**
2. Tapez 7 fois sur **Numéro de build**
3. **Paramètres** → **Options de développement**
4. Activez **Débogage USB**
5. Connectez via USB

### Solution 3: Build sans appareil (Génération APK directe)

#### Méthode EAS Build (Recommandée)
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter à Expo
eas login

# Configurer le build
eas build:configure

# Lancer le build APK
eas build --platform android --profile production
```

#### Méthode locale avec Gradle
```bash
# Générer d'abord le projet Android
npx expo prebuild --platform android

# Aller dans le dossier Android
cd android

# Build avec Gradle
./gradlew assembleRelease
```

### Solution 4: Configuration avancée des émulateurs

#### Créer un émulateur optimisé pour Fire TV
```bash
# Via ligne de commande
avdmanager create avd -n FireTV_Emulator -k "system-images;android-30;google_apis;x86_64" -d "tv_1080p"

# Démarrer avec options spécifiques
emulator -avd FireTV_Emulator -gpu host -memory 2048 -cores 4
```

## 🔧 Configuration du projet pour différents scénarios

### Mise à jour d'app.json pour EAS Build
```json
{
  "expo": {
    "name": "Presentation Kiosk",
    "slug": "presentation-kiosk-firetv",
    "version": "1.0.0",
    "orientation": "landscape",
    "android": {
      "package": "com.presentationkiosk.firetv",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#0a0a0a"
      },
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WAKE_LOCK"
      ]
    }
  }
}
```

### Configuration EAS (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 🚀 Scripts automatisés

### Script de setup complet
```bash
#!/bin/bash
echo "🔧 Configuration automatique pour build Android"

# Vérifier si Android Studio est installé
if ! command -v adb &> /dev/null; then
    echo "❌ Android SDK non trouvé. Installez Android Studio."
    exit 1
fi

# Vérifier les émulateurs disponibles
echo "📱 Émulateurs disponibles:"
emulator -list-avds

# Vérifier les appareils connectés
echo "🔌 Appareils connectés:"
adb devices

# Proposer de créer un émulateur si aucun appareil
if [ $(adb devices | wc -l) -le 2 ]; then
    echo "⚠️ Aucun appareil détecté."
    echo "Voulez-vous créer un émulateur Fire TV? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        avdmanager create avd -n FireTV_Auto -k "system-images;android-30;google_apis;x86_64" -d "tv_1080p"
        emulator -avd FireTV_Auto &
        echo "⏳ Attente du démarrage de l'émulateur..."
        adb wait-for-device
    fi
fi

# Lancer le build
echo "🏗️ Lancement du build..."
npx expo run:android --no-install --no-bundler
```

## 📋 Checklist de dépannage

- [ ] Android Studio installé avec SDK
- [ ] Variables d'environnement configurées (ANDROID_HOME)
- [ ] Émulateur créé et démarré OU appareil physique connecté
- [ ] ADB fonctionne (`adb devices` montre un appareil)
- [ ] Dépendances npm installées
- [ ] Projet Expo configuré correctement

## 🆘 Commandes de diagnostic

```bash
# Vérifier l'installation Android SDK
echo $ANDROID_HOME
which adb

# Lister les émulateurs
emulator -list-avds

# Vérifier les appareils connectés
adb devices

# Redémarrer ADB si nécessaire
adb kill-server
adb start-server

# Vérifier les packages SDK installés
sdkmanager --list | grep "system-images"
```

## 🎯 Recommandation finale

**Pour un développement rapide :** Utilisez EAS Build qui compile dans le cloud sans nécessiter d'appareil local.

**Pour un contrôle total :** Configurez un émulateur Android TV dans Android Studio.

**Pour tester sur Fire TV réel :** Connectez votre Fire TV via ADB WiFi.