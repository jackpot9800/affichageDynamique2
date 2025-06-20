# 🔧 Solution : Erreur 404 EAS CLI sous Windows

## 🚨 Erreur identifiée
```
npm error 404 Not Found - GET https://registry.npmjs.org/@expo%2feas-cli
npm error 404 '@expo/eas-cli@*' is not in this registry.
```

## ✅ Solution immédiate (RECOMMANDÉE)

### 🚀 Méthode 1: Utiliser npx (évite tous les problèmes)
```cmd
# Au lieu d'installer globalement, utilisez directement npx :

# 1. Connexion à Expo
npx @expo/eas-cli login

# 2. Configuration du projet
npx @expo/eas-cli build:configure

# 3. Build APK
npx @expo/eas-cli build --platform android --profile production
```

**Pourquoi npx est meilleur :**
- ✅ Pas de problème d'installation
- ✅ Évite les erreurs 404
- ✅ Toujours la dernière version
- ✅ Fonctionne même avec des restrictions réseau
- ✅ Pas besoin de permissions administrateur

## 🔧 Solutions alternatives si npx ne fonctionne pas

### Méthode 2: Correction du registre npm
```cmd
# 1. Nettoyer le cache npm
npm cache clean --force

# 2. Corriger le registre npm
npm config set registry https://registry.npmjs.org/

# 3. Vérifier la configuration
npm config get registry

# 4. Réessayer l'installation
npm install -g @expo/eas-cli
```

### Méthode 3: Mise à jour de npm
```cmd
# 1. Mettre à jour npm
npm install -g npm@latest

# 2. Réessayer l'installation
npm install -g @expo/eas-cli
```

### Méthode 4: Installation avec force
```cmd
# Installation forcée
npm install -g @expo/eas-cli --force

# Ou avec registre explicite
npm install -g @expo/eas-cli --registry https://registry.npmjs.org/
```

## 🔍 Diagnostic des causes possibles

### Cause 1: Cache npm corrompu
```cmd
# Nettoyage complet
npm cache clean --force
npm cache verify
```

### Cause 2: Registre npm incorrect
```cmd
# Vérifier le registre actuel
npm config get registry

# Doit être : https://registry.npmjs.org/
# Si différent, corriger :
npm config set registry https://registry.npmjs.org/
```

### Cause 3: Problème de proxy/firewall
```cmd
# Si vous êtes dans un environnement d'entreprise
npm config get proxy
npm config get https-proxy

# Si nécessaire, configurer le proxy
npm config set proxy http://proxy.company.com:8080
```

### Cause 4: Version Node.js incompatible
```cmd
# Vérifier votre version
node --version

# EAS CLI nécessite Node.js 16+ (recommandé: 18 ou 20)
```

## 🎯 Processus complet avec npx

### Étape 1: Préparation
```cmd
# Naviguez vers votre projet
cd e:\22\project

# Vérifiez que c'est un projet Expo
dir package.json
```

### Étape 2: Build avec npx
```cmd
# Connexion (une seule fois)
npx @expo/eas-cli login

# Configuration (première fois)
npx @expo/eas-cli build:configure

# Build APK
npx @expo/eas-cli build --platform android --profile production
```

### Étape 3: Téléchargement et installation
1. **Connectez-vous** sur https://expo.dev
2. **Allez** dans vos projets
3. **Téléchargez** l'APK généré
4. **Installez** sur Fire TV :
   ```cmd
   adb connect 192.168.1.XXX:5555
   adb install presentation-kiosk.apk
   ```

## 🎉 Avantages d'EAS Build

✅ **Pas besoin d'Android Studio**
✅ **Build dans le cloud**
✅ **APK optimisé automatiquement**
✅ **Signature automatique**
✅ **Résout les problèmes d'écran blanc**
✅ **Compatible avec tous les PC Windows**

## 🆘 Si npx ne fonctionne pas non plus

### Alternative 1: Expo CLI classique
```cmd
npm install -g @expo/cli
npx expo build:android
```

### Alternative 2: Build local (nécessite Android Studio)
```cmd
npx expo run:android
```

### Alternative 3: Export vers Android Studio
```cmd
npx expo prebuild --platform android
# Puis ouvrir le dossier android/ dans Android Studio
```

## 📋 Checklist de validation

- [ ] ✅ npx @expo/eas-cli login fonctionne
- [ ] ✅ npx @expo/eas-cli build:configure réussit
- [ ] ✅ npx @expo/eas-cli build lance le build
- [ ] ✅ APK téléchargé depuis expo.dev
- [ ] ✅ APK installé sur Fire TV
- [ ] ✅ Application fonctionne (pas d'écran blanc)

## 🚀 Commande finale recommandée

```cmd
npx @expo/eas-cli build --platform android --profile production
```

Cette commande unique évite tous les problèmes d'installation et génère directement votre APK ! 🎯