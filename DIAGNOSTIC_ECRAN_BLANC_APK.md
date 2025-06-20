# 🔧 Diagnostic : Écran blanc sur APK Android

## 🚨 Problème identifié
L'APK se compile correctement avec Android Studio mais l'application reste blanche une fois installée sur l'appareil Android.

## 🔍 Causes principales

### Cause 1: Bundle JavaScript manquant (90% des cas)
L'APK ne contient pas le code JavaScript de votre application React Native.

### Cause 2: Erreur de configuration Metro
Le bundler Metro n'a pas été configuré correctement pour inclure le code.

### Cause 3: Problème de réseau au démarrage
L'application essaie de se connecter à un serveur de développement inexistant.

## ✅ Solutions par ordre de priorité

### Solution 1: Vérifier le bundle JavaScript
```cmd
# Vérifiez si le bundle existe dans l'APK
# Décompressez l'APK et cherchez :
# assets/index.android.bundle
```

### Solution 2: Recompiler avec bundle intégré
```cmd
# Supprimez le flag --no-bundler
npx expo run:android

# Au lieu de :
npx expo run:android --no-bundler
```

### Solution 3: Build EAS (recommandé)
```cmd
# EAS Build inclut automatiquement le bundle
npx eas-cli build --platform android --profile production
```

## 🔧 Test rapide
Installez l'APK et vérifiez les logs :
```cmd
adb logcat | findstr "ReactNative\|JavaScript\|Bundle"
```

Si vous voyez des erreurs comme "Could not connect to development server", c'est confirmé !