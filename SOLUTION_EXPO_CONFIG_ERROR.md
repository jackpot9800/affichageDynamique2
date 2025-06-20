# 🔧 Solution : Erreur de configuration Expo

## 🚨 Erreur identifiée
```
Failed to read the app config from the project using "npx expo config" command
Failed to resolve plugin for module "expo-router"
```

Cette erreur indique que :
1. La configuration Expo n'est pas correcte
2. Le plugin expo-router n'est pas trouvé
3. Il peut y avoir des dépendances manquantes

## ✅ Solution étape par étape

### Étape 1: Correction automatique
```cmd
# Exécutez le script de correction
fix-expo-config.bat
```

### Étape 2: Vérification manuelle
```cmd
# Vérifiez que expo-router est installé
npm list expo-router

# Si absent, installez-le
npm install expo-router
```

### Étape 3: Vérification d'app.json
Votre `app.json` doit contenir au minimum :

```json
{
  "expo": {
    "name": "Presentation Kiosk",
    "slug": "presentation-kiosk-firetv",
    "version": "1.0.0",
    "platforms": ["android", "web"],
    "plugins": ["expo-router"]
  }
}
```

### Étape 4: Test de la configuration
```cmd
# Testez que la configuration fonctionne
npx expo config --json
```

### Étape 5: Build EAS
```cmd
# Une fois la configuration corrigée
npx @expo/eas-cli build --platform android --profile production
```

## 🔧 Solutions alternatives

### Solution 1: Configuration minimale
Si le problème persiste, créez un `eas.json` simplifié :

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Puis lancez :
```cmd
npx @expo/eas-cli build --platform android --profile production --non-interactive
```

### Solution 2: Réinitialisation complète
```cmd
# Supprimez tout et recommencez
rmdir /s /q node_modules
del package-lock.json
del eas.json
npm install
npx @expo/eas-cli build:configure
```

### Solution 3: Build sans configuration complexe
```cmd
# Utilisez les paramètres par défaut
npx @expo/eas-cli build --platform android --profile production --clear-cache
```

## 🎯 Commandes de diagnostic

### Vérifier les dépendances
```cmd
npm list expo-router
npm list @expo/config
npm list @expo/config-plugins
```

### Vérifier la configuration
```cmd
npx expo config --type public
npx expo doctor
```

### Nettoyer le cache
```cmd
npm cache clean --force
npx expo install --fix
```

## 🚀 Script automatique complet

Utilisez `build-eas-final.bat` qui :
1. ✅ Corrige automatiquement app.json
2. ✅ Réinstalle les dépendances
3. ✅ Vérifie expo-router
4. ✅ Lance le build EAS
5. ✅ Gère les erreurs automatiquement

## 📱 Résultat attendu

Après correction, vous devriez voir :
```
✅ Configuration Expo valide
🚀 Build EAS lancé avec succès
📱 APK sera disponible sur expo.dev
```

## 🆘 Si le problème persiste

### Vérifiez votre environnement
```cmd
node --version  # Doit être 16+
npm --version   # Doit être 8+
```

### Utilisez la méthode alternative
```cmd
# Build local au lieu d'EAS
npx expo run:android
```

### Contactez le support
Si rien ne fonctionne, le problème peut venir de :
- Version de Node.js incompatible
- Projet corrompu
- Restrictions réseau d'entreprise

Dans ce cas, recommencez avec un projet Expo frais.