# 🚀 Guide rapide : Build APK avec npx

## 🎯 Solution en 3 étapes (évite tous les problèmes)

### Étape 1: Préparation
```cmd
# Naviguez vers votre projet
cd e:\22\project

# Vérifiez que package.json existe
dir package.json
```

### Étape 2: Build avec npx
```cmd
# Connexion à Expo (une seule fois)
npx @expo/eas-cli login

# Configuration (première fois)
npx @expo/eas-cli build:configure

# Build APK
npx @expo/eas-cli build --platform android --profile production
```

### Étape 3: Installation sur Fire TV
```cmd
# Téléchargez l'APK depuis https://expo.dev
# Puis installez :
adb connect 192.168.1.XXX:5555
adb install presentation-kiosk.apk
```

## ✅ Pourquoi npx résout votre problème

- **Pas d'installation globale** → Évite l'erreur 404
- **Toujours la dernière version** → Pas de problème de compatibilité
- **Pas de permissions admin** → Fonctionne sur tous les PC
- **Évite les problèmes de cache** → Installation fraîche à chaque fois

## 🎯 Commande unique

```cmd
npx @expo/eas-cli build --platform android --profile production
```

Cette commande fait tout automatiquement ! 🚀

## 📱 Résultat

- **APK optimisé** (~15-25 MB)
- **Signé automatiquement**
- **Compatible Fire TV**
- **Pas d'écran blanc**
- **Prêt pour installation**

## 🆘 Si npx ne fonctionne pas

Testez votre connectivité :
```cmd
test-npm-registry.bat
```

Puis utilisez le script automatique :
```cmd
build-npx-simple.bat
```