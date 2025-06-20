# 🔧 Solution : Installation EAS CLI sous Windows

## 🚨 Erreur identifiée
```
'eas' n'est pas reconnu en tant que commande interne
```

Cette erreur indique que EAS CLI n'est pas installé correctement ou n'est pas dans le PATH.

## ✅ Solution étape par étape

### Étape 1: Installation correcte d'EAS CLI
```cmd
# CORRECT (avec @)
npm install -g @expo/eas-cli

# INCORRECT (ce que vous avez fait)
npm install -g expo/eas-cli
```

### Étape 2: Vérification de l'installation
```cmd
# Vérifiez que EAS est installé
eas --version

# Si ça ne fonctionne pas, redémarrez PowerShell
```

### Étape 3: Exécution du script de réparation
```cmd
# Double-cliquez sur fix-eas-installation.bat
# OU exécutez dans PowerShell :
fix-eas-installation.bat
```

## 🔧 Solutions alternatives si le problème persiste

### Solution 1: Installation avec NPX
```cmd
# Utilisez npx au lieu d'installer globalement
npx @expo/eas-cli login
npx @expo/eas-cli build --platform android --profile production
```

### Solution 2: Vérification du PATH
```cmd
# Vérifiez où npm installe les packages globaux
npm config get prefix

# Ajoutez ce chemin à votre PATH si nécessaire
# Généralement : C:\Users\%USERNAME%\AppData\Roaming\npm
```

### Solution 3: Installation en tant qu'administrateur
```cmd
# Ouvrez PowerShell en tant qu'administrateur
# Puis réessayez l'installation
npm install -g @expo/eas-cli
```

### Solution 4: Nettoyage du cache npm
```cmd
# Nettoyez le cache npm
npm cache clean --force

# Réinstallez
npm install -g @expo/eas-cli
```

## 🚀 Processus complet EAS Build

### 1. Installation et connexion
```cmd
npm install -g @expo/eas-cli
eas login
```

### 2. Configuration du projet
```cmd
# Dans votre dossier de projet
eas build:configure
```

### 3. Build APK
```cmd
# Pour un APK de production
eas build --platform android --profile production

# Pour un APK de développement
eas build --platform android --profile development
```

### 4. Téléchargement
- L'APK sera disponible sur votre compte Expo
- Vous recevrez un lien de téléchargement
- L'APK sera optimisé et signé automatiquement

## 🎯 Avantages d'EAS Build

✅ **Pas besoin d'Android Studio**
✅ **Build dans le cloud**
✅ **APK optimisé automatiquement**
✅ **Signature automatique**
✅ **Compatible avec tous les PC Windows**
✅ **Résout les problèmes d'écran blanc**

## 🔍 Diagnostic des problèmes

### Problème : "eas command not found"
```cmd
# Vérifiez l'installation
npm list -g @expo/eas-cli

# Si absent, réinstallez
npm install -g @expo/eas-cli
```

### Problème : "Permission denied"
```cmd
# Exécutez PowerShell en tant qu'administrateur
# Ou utilisez npx
npx @expo/eas-cli build --platform android
```

### Problème : "Network error"
```cmd
# Vérifiez votre connexion internet
# Vérifiez les paramètres de proxy/firewall
```

## 📱 Installation sur Fire TV après EAS Build

### 1. Téléchargement de l'APK
- Connectez-vous sur https://expo.dev
- Allez dans vos builds
- Téléchargez l'APK

### 2. Installation via ADB
```cmd
# Connectez votre Fire TV
adb connect 192.168.1.XXX:5555

# Installez l'APK téléchargé
adb install presentation-kiosk.apk
```

### 3. Installation via Downloader
- Uploadez l'APK sur Google Drive
- Utilisez l'app Downloader sur Fire TV
- Téléchargez et installez

## 🎉 Résultat final

Avec EAS Build, vous obtiendrez :
- **APK optimisé** (~15-25 MB)
- **Signé automatiquement**
- **Compatible Fire TV**
- **Pas d'écran blanc**
- **Prêt pour distribution**

EAS Build est la solution la plus simple et la plus fiable pour créer des APK depuis Windows ! 🚀