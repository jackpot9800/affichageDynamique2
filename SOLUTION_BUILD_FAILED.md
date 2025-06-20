# 🔧 Solution : Build EAS échoué

## 🚨 Causes possibles d'échec

1. **Configuration invalide** - app.json ou eas.json incorrect
2. **Dépendances manquantes** - expo-router ou autres packages
3. **Problème de réseau** - Connexion interrompue
4. **Erreur de compilation** - Code incompatible
5. **Limites de compte** - Quota EAS dépassé

## ✅ Solutions par ordre de priorité

### Solution 1: Diagnostic automatique
```cmd
# Exécutez le diagnostic
debug-build-failure.bat

# Puis la réparation
fix-build-failure.bat
```

### Solution 2: Réparation manuelle

#### Étape 1: Nettoyage complet
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### Étape 2: Correction d'app.json
Créez un app.json minimal :
```json
{
  "expo": {
    "name": "Presentation Kiosk",
    "slug": "presentation-kiosk-firetv",
    "version": "1.0.0",
    "platforms": ["android"],
    "android": {
      "package": "com.presentationkiosk.firetv",
      "versionCode": 1
    },
    "plugins": ["expo-router"]
  }
}
```

#### Étape 3: Correction d'eas.json
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

#### Étape 4: Nouveau build
```cmd
npx eas-cli build --platform android --profile production
```

### Solution 3: Méthodes alternatives

#### Option A: Build local
```cmd
# Nécessite Android Studio
npx expo run:android
```

#### Option B: Export vers Android Studio
```cmd
# Génère le projet Android natif
npx expo prebuild --platform android

# Puis ouvrir android/ dans Android Studio
```

#### Option C: Expo CLI classique
```cmd
npm install -g @expo/cli
npx expo build:android
```

## 🔍 Diagnostic des erreurs spécifiques

### Erreur : "Configuration invalid"
**Solution :**
- Vérifiez app.json et eas.json
- Supprimez les plugins non essentiels
- Utilisez une configuration minimale

### Erreur : "Dependencies not found"
**Solution :**
```cmd
npm install expo-router
npm install --save-dev @types/react
```

### Erreur : "Build timeout"
**Solution :**
- Relancez le build
- Utilisez un profil development au lieu de production
- Vérifiez votre connexion internet

### Erreur : "Quota exceeded"
**Solution :**
- Attendez le renouvellement mensuel
- Utilisez un build local
- Créez un nouveau compte Expo

## 🎯 Recommandations

### Pour un succès rapide :
1. **Utilisez npx** au lieu d'installer globalement
2. **Configuration minimale** - moins de plugins
3. **Build development** d'abord pour tester
4. **Vérifiez les logs** pour identifier l'erreur exacte

### Configuration recommandée :
```json
{
  "expo": {
    "name": "Presentation Kiosk",
    "slug": "presentation-kiosk-firetv",
    "version": "1.0.0",
    "platforms": ["android"],
    "android": {
      "package": "com.presentationkiosk.firetv"
    },
    "plugins": ["expo-router"]
  }
}
```

## 🚀 Script de récupération rapide

```cmd
# Tout-en-un
fix-build-failure.bat

# Ou méthodes alternatives
build-alternative-methods.bat
```

## 📱 Résultat attendu

Après correction, vous devriez obtenir :
- ✅ Build EAS réussi
- ✅ APK téléchargeable
- ✅ Compatible Fire TV
- ✅ Prêt pour installation

## 🆘 Si tout échoue

### Dernière option : Recommencer
```cmd
# Créez un nouveau projet Expo
npx create-expo-app --template blank-typescript

# Copiez vos fichiers sources
# Relancez le build
```

La plupart des échecs de build sont dus à des configurations incorrectes. Les scripts automatiques devraient résoudre le problème ! 🚀