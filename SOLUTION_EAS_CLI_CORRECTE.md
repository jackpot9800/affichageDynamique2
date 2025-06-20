# 🔧 Solution : Installation correcte d'EAS CLI

## 🚨 Erreur identifiée

Vous essayez d'installer le mauvais package :
```cmd
❌ INCORRECT : npm install -g @expo/eas-cli
✅ CORRECT   : npm install -g eas-cli
```

## ✅ Solution immédiate

### Méthode 1: Installation correcte
```cmd
# Nettoyez le cache
npm cache clean --force

# Installez le BON package (sans @expo/)
npm install -g eas-cli

# Vérifiez l'installation
eas --version
```

### Méthode 2: Utiliser npx (RECOMMANDÉE)
```cmd
# Évite tous les problèmes d'installation
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile production
```

## 🎯 Pourquoi cette erreur ?

Le package EAS CLI a changé de nom :
- **Ancien** : `@expo/eas-cli` (n'existe plus)
- **Nouveau** : `eas-cli` (package actuel)

## 🚀 Processus complet

### Étape 1: Installation
```cmd
# Exécutez le script
install-eas-correct.bat

# OU manuellement
npm install -g eas-cli
```

### Étape 2: Build APK
```cmd
# Exécutez le script
build-avec-eas-correct.bat

# OU manuellement
eas login
eas build:configure
eas build --platform android --profile production
```

### Étape 3: Installation sur Fire TV
```cmd
# Téléchargez l'APK depuis expo.dev
# Puis installez
adb connect 192.168.1.XXX:5555
adb install presentation-kiosk.apk
```

## 🎉 Avantages d'EAS Build

✅ **Pas besoin d'Android Studio**
✅ **Build dans le cloud**
✅ **APK optimisé automatiquement**
✅ **Signature automatique**
✅ **Résout les problèmes d'écran blanc**
✅ **Compatible Fire TV**

## 🆘 Si ça ne fonctionne toujours pas

### Option 1: NPX (évite tous les problèmes)
```cmd
solution-npx-eas.bat
```

### Option 2: Build local
```cmd
npx expo run:android
```

### Option 3: Export vers Android Studio
```cmd
npx expo prebuild --platform android
```

## 📋 Commandes finales

```cmd
# Installation correcte
npm install -g eas-cli

# OU avec npx (recommandé)
npx eas-cli build --platform android --profile production
```

Cette fois, ça devrait fonctionner ! 🚀