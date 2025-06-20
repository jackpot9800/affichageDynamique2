# 🔧 Solution : Erreur 404 EAS CLI

## 🚨 Erreur identifiée
```
npm error 404 Not Found - GET https://registry.npmjs.org/@expo%2feas-cli
npm error 404 '@expo/eas-cli@*' is not in this registry.
```

Cette erreur peut avoir plusieurs causes :

## ✅ Solutions par ordre de priorité

### Solution 1: Utiliser npx (RECOMMANDÉE)
Au lieu d'installer EAS CLI globalement, utilisez npx :

```cmd
# Connexion
npx @expo/eas-cli login

# Configuration
npx @expo/eas-cli build:configure

# Build APK
npx @expo/eas-cli build --platform android --profile production
```

**Avantages :**
- ✅ Pas de problème d'installation
- ✅ Toujours la dernière version
- ✅ Évite les conflits de permissions
- ✅ Fonctionne même avec des restrictions réseau

### Solution 2: Correction du registre npm
```cmd
# Nettoyer le cache
npm cache clean --force

# Corriger le registre
npm config set registry https://registry.npmjs.org/

# Réessayer l'installation
npm install -g @expo/eas-cli
```

### Solution 3: Mise à jour de npm
```cmd
# Mettre à jour npm
npm install -g npm@latest

# Réessayer l'installation
npm install -g @expo/eas-cli
```

### Solution 4: Installation avec force
```cmd
# Installation forcée
npm install -g @expo/eas-cli --force

# Ou avec registre explicite
npm install -g @expo/eas-cli --registry https://registry.npmjs.org/
```

## 🔍 Diagnostic des causes

### Cause 1: Problème de réseau/proxy
Si vous êtes dans un environnement d'entreprise :
```cmd
# Vérifiez la configuration proxy
npm config get proxy
npm config get https-proxy

# Si nécessaire, configurez le proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### Cause 2: Cache npm corrompu
```cmd
# Nettoyage complet du cache
npm cache clean --force
npm cache verify
```

### Cause 3: Version de Node.js incompatible
```cmd
# Vérifiez votre version Node.js
node --version

# EAS CLI nécessite Node.js 16+ (recommandé: 18 ou 20)
```

### Cause 4: Registre npm incorrect
```cmd
# Vérifiez le registre actuel
npm config get registry

# Doit être : https://registry.npmjs.org/
# Si différent, corrigez :
npm config set registry https://registry.npmjs.org/
```

## 🚀 Processus complet avec npx

### Étape 1: Préparation
```cmd
# Naviguez vers votre projet
cd C:\projets\presentation-kiosk

# Vérifiez que c'est un projet Expo
dir package.json
```

### Étape 2: Connexion Expo
```cmd
npx @expo/eas-cli login
```

### Étape 3: Configuration
```cmd
npx @expo/eas-cli build:configure
```

### Étape 4: Build APK
```cmd
# Production (recommandé)
npx @expo/eas-cli build --platform android --profile production

# Ou development (pour tests)
npx @expo/eas-cli build --platform android --profile development
```

### Étape 5: Téléchargement
- Connectez-vous sur https://expo.dev
- Allez dans vos projets
- Téléchargez l'APK généré

## 🎯 Avantages de npx vs installation globale

| Aspect | npx | Installation globale |
|--------|-----|---------------------|
| **Installation** | ✅ Aucune | ❌ Peut échouer |
| **Permissions** | ✅ Aucun problème | ❌ Peut nécessiter admin |
| **Version** | ✅ Toujours à jour | ❌ Peut être obsolète |
| **Réseau** | ✅ Moins de restrictions | ❌ Plus de blocages |
| **Maintenance** | ✅ Automatique | ❌ Manuelle |

## 🔧 Scripts automatisés

### Script 1: `build-avec-npx.bat`
Utilisez ce script pour un build automatique avec npx.

### Script 2: `fix-eas-cli-final.bat`
Essaie toutes les méthodes d'installation possibles.

## 📱 Installation sur Fire TV

Une fois l'APK téléchargé :

```cmd
# Connectez votre Fire TV
adb connect 192.168.1.XXX:5555

# Installez l'APK
adb install presentation-kiosk.apk

# Lancez l'application
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
```

## 🆘 Si tout échoue

### Alternative 1: Expo CLI classique
```cmd
npm install -g @expo/cli
expo build:android
```

### Alternative 2: Build local
```cmd
npx expo run:android
```

### Alternative 3: Export vers Android Studio
```cmd
npx expo prebuild --platform android
# Puis ouvrir android/ dans Android Studio
```

## 🎉 Recommandation finale

**Utilisez npx** - c'est la méthode la plus fiable et la plus simple :

```cmd
npx @expo/eas-cli build --platform android --profile production
```

Cette approche évite tous les problèmes d'installation et fonctionne dans 99% des cas ! 🚀