# 📱 Guide de Build APK et Déploiement Fire TV Stick

## 🏗️ Étape 1: Préparation du Build

### Installation d'EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Connexion à votre compte Expo
```bash
eas login
```

### Configuration du projet
```bash
eas build:configure
```

## 📦 Étape 2: Configuration pour Android TV

### Mise à jour d'app.json
Ajoutez la configuration Android TV dans votre `app.json` :

```json
{
  "expo": {
    "name": "Presentation Kiosk",
    "slug": "presentation-kiosk-firetv",
    "version": "1.0.0",
    "orientation": "landscape",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "dark",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      },
      "package": "com.yourcompany.presentationkiosk",
      "versionCode": 1,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WAKE_LOCK"
      ],
      "intentFilters": [
        {
          "action": "android.intent.action.MAIN",
          "category": [
            "android.intent.category.LAUNCHER",
            "android.intent.category.LEANBACK_LAUNCHER"
          ]
        }
      ]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser"
    ]
  }
}
```

### Configuration EAS Build
Créez/modifiez `eas.json` :

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
  },
  "submit": {
    "production": {}
  }
}
```

## 🔨 Étape 3: Build de l'APK

### Build de développement (recommandé pour tests)
```bash
eas build --platform android --profile development
```

### Build de production
```bash
eas build --platform android --profile production
```

### Build local (si vous préférez)
```bash
eas build --platform android --local
```

## 📲 Étape 4: Installation sur Fire TV Stick

### Méthode 1: ADB (Android Debug Bridge)

#### Installation d'ADB
- **Windows**: Téléchargez Android SDK Platform Tools
- **macOS**: `brew install android-platform-tools`
- **Linux**: `sudo apt install android-tools-adb`

#### Activation du mode développeur sur Fire TV
1. Allez dans **Paramètres** > **My Fire TV** > **About**
2. Cliquez 7 fois sur **Build** pour activer le mode développeur
3. Retournez et allez dans **Developer Options**
4. Activez **ADB Debugging** et **Apps from Unknown Sources**

#### Installation via ADB
```bash
# Connecter via WiFi (remplacez par l'IP de votre Fire TV)
adb connect 192.168.1.XXX:5555

# Installer l'APK
adb install presentation-kiosk.apk

# Lancer l'application
adb shell am start -n com.yourcompany.presentationkiosk/.MainActivity
```

### Méthode 2: Downloader App

1. Installez **Downloader** depuis l'Amazon Appstore sur votre Fire TV
2. Uploadez votre APK sur un service cloud (Google Drive, Dropbox, etc.)
3. Obtenez le lien de téléchargement direct
4. Utilisez Downloader pour télécharger et installer l'APK

### Méthode 3: ES File Explorer

1. Installez **ES File Explorer** (si disponible)
2. Transférez l'APK via réseau local
3. Installez directement depuis l'explorateur

## 🎯 Étape 5: Optimisations Fire TV

### Configuration pour télécommande Fire TV
Ajoutez dans votre composant principal :

```typescript
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';

export default function App() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Gérer le bouton retour de la télécommande
        return true; // Empêche la fermeture de l'app
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );
}
```

### Gestion de la navigation D-pad
```typescript
import { TVEventHandler } from 'react-native';

useEffect(() => {
  const tvEventHandler = new TVEventHandler();
  
  tvEventHandler.enable(this, (cmp, evt) => {
    if (evt && evt.eventType === 'right') {
      // Navigation droite
    } else if (evt && evt.eventType === 'left') {
      // Navigation gauche
    }
  });

  return () => {
    tvEventHandler.disable();
  };
}, []);
```

## 🚀 Étape 6: Déploiement automatique

### Script de déploiement automatique
Créez `deploy-firetv.sh` :

```bash
#!/bin/bash

# Configuration
FIRE_TV_IP="192.168.1.XXX"
APK_PATH="./presentation-kiosk.apk"
PACKAGE_NAME="com.yourcompany.presentationkiosk"

echo "🔥 Déploiement sur Fire TV Stick..."

# Connexion ADB
echo "📱 Connexion à Fire TV..."
adb connect $FIRE_TV_IP:5555

# Désinstallation de l'ancienne version
echo "🗑️ Désinstallation de l'ancienne version..."
adb uninstall $PACKAGE_NAME

# Installation de la nouvelle version
echo "📦 Installation de la nouvelle version..."
adb install $APK_PATH

# Lancement de l'application
echo "🚀 Lancement de l'application..."
adb shell am start -n $PACKAGE_NAME/.MainActivity

echo "✅ Déploiement terminé!"
```

### Automatisation avec GitHub Actions
Créez `.github/workflows/build-and-deploy.yml` :

```yaml
name: Build and Deploy to Fire TV

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Build APK
        run: eas build --platform android --non-interactive
```

## 🔧 Étape 7: Configuration avancée

### Variables d'environnement pour production
Créez `.env.production` :

```env
EXPO_PUBLIC_API_URL=http://198.16.183.68/mods/livetv/api/index.php
EXPO_PUBLIC_APP_NAME=Presentation Kiosk
EXPO_PUBLIC_VERSION=1.0.0
```

### Optimisations de performance
```typescript
// Dans votre app.json, ajoutez :
{
  "expo": {
    "android": {
      "jsEngine": "hermes", // Moteur JS plus rapide
      "enableProguardInReleaseBuilds": true, // Optimisation du code
      "enableSeparateBuildPerCPUArchitecture": false
    }
  }
}
```

## 📋 Checklist de déploiement

- [ ] Mode développeur activé sur Fire TV
- [ ] ADB debugging activé
- [ ] Applications tierces autorisées
- [ ] APK signé et optimisé
- [ ] Tests sur Fire TV réel
- [ ] Configuration réseau correcte
- [ ] Gestion de la télécommande testée
- [ ] Performance vérifiée
- [ ] Auto-start configuré (optionnel)

## 🆘 Dépannage

### Problèmes courants

**APK ne s'installe pas :**
- Vérifiez que "Apps from Unknown Sources" est activé
- Assurez-vous que l'APK est signé correctement

**Application ne démarre pas :**
- Vérifiez les logs : `adb logcat | grep YourApp`
- Vérifiez les permissions dans AndroidManifest.xml

**Problèmes de réseau :**
- Testez la connectivité : `adb shell ping 8.8.8.8`
- Vérifiez les paramètres WiFi du Fire TV

**Performance lente :**
- Activez Hermes dans app.json
- Optimisez les images et ressources
- Utilisez le profiling React Native

## 📞 Support

Pour plus d'aide :
- Documentation Expo : https://docs.expo.dev/
- Forum Fire TV : https://developer.amazon.com/forums/category/11
- React Native TV : https://github.com/react-native-tvos/react-native-tvos