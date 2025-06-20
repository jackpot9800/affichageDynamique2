# 🔧 Solution : Écran blanc sous Windows

## 🚨 Problème identifié
Après avoir téléchargé le ZIP et ouvert le projet sous Windows, l'application démarre mais reste blanche.

## ✅ Solution rapide (Windows)

### Étape 1: Exécuter le script de réparation
```cmd
# Double-cliquez sur le fichier fix-project-windows.bat
# OU exécutez dans le terminal :
fix-project-windows.bat
```

### Étape 2: Vérification manuelle si nécessaire
```cmd
# Naviguez vers le dossier du projet
cd presentation-kiosk

# Nettoyage complet
rmdir /s /q node_modules
del package-lock.json
npm install

# Démarrage avec cache nettoyé
npx expo start --clear
```

### Étape 3: Vérifier dans le navigateur
1. Ouvrez **Chrome** ou **Edge**
2. Appuyez sur **F12** pour ouvrir les outils de développement
3. Regardez l'onglet **Console** pour les erreurs
4. Regardez l'onglet **Network** pour les requêtes échouées

## 🔍 Erreurs courantes sous Windows

### Erreur 1: "Cannot resolve module '@/hooks/useFrameworkReady'"
**Solution :** Le script crée automatiquement ce fichier manquant.

### Erreur 2: "ENOENT: no such file or directory"
**Solution :** 
```cmd
# Vérifiez que vous êtes dans le bon dossier
dir package.json
# Si absent, naviguez vers le bon dossier
```

### Erreur 3: "Permission denied" ou "Access denied"
**Solutions :**
- Exécutez le terminal en tant qu'**Administrateur**
- Désactivez temporairement l'**antivirus**
- Vérifiez que le dossier n'est pas en **lecture seule**

### Erreur 4: "npm ERR! code EACCES"
**Solution :**
```cmd
# Nettoyer le cache npm
npm cache clean --force
# Réessayer l'installation
npm install
```

## 🎯 Test de validation

Après la réparation, vérifiez que :

1. ✅ **Console propre** : Aucune erreur rouge dans F12
2. ✅ **Navigation** : Les onglets en bas sont visibles
3. ✅ **Contenu** : Vous voyez "Kiosque de Présentations"
4. ✅ **Paramètres** : L'onglet Paramètres fonctionne
5. ✅ **Configuration** : Vous pouvez entrer l'URL du serveur

## 🚀 Compilation APK après réparation

Une fois que l'application fonctionne en web :

### Option 1: EAS Build (Recommandée)
```cmd
npm install -g @expo/eas-cli
eas login
eas build --platform android --profile production
```

### Option 2: Build local (nécessite Android Studio)
```cmd
npx expo run:android --no-install --no-bundler
```

### Option 3: Export vers Android Studio
```cmd
npx expo prebuild --platform android
# Puis ouvrir le dossier android/ dans Android Studio
```

## 🛠️ Outils Windows recommandés

### Terminal recommandé
- **PowerShell** (intégré à Windows)
- **Windows Terminal** (Microsoft Store)
- **Git Bash** (avec Git for Windows)

### Éditeur de code
- **Visual Studio Code** (gratuit)
- **Cursor** (basé sur VS Code)

### Android Development
- **Android Studio** (pour compilation APK)
- **Scrcpy** (pour contrôler Fire TV depuis PC)

## 🔧 Configuration Android Studio sous Windows

### Installation
1. Téléchargez Android Studio : https://developer.android.com/studio
2. Installez avec les composants par défaut
3. Configurez les variables d'environnement :

```cmd
# Ajoutez à vos variables d'environnement système :
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
Path=%Path%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

### Vérification
```cmd
# Testez que ADB fonctionne
adb version
```

## 🔥 Configuration Fire TV sous Windows

### Connexion ADB
```cmd
# Activez le mode développeur sur Fire TV
# Paramètres → My Fire TV → Developer Options
# Activez ADB Debugging

# Connectez via WiFi (remplacez l'IP)
adb connect 192.168.1.XXX:5555

# Vérifiez la connexion
adb devices
```

### Installation APK
```cmd
# Une fois l'APK compilé
adb install app-release.apk

# Lancer l'application
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
```

## 🆘 Si le problème persiste

1. **Redémarrez Windows** (résout souvent les problèmes de permissions)
2. **Utilisez un autre navigateur** (Chrome, Edge, Firefox)
3. **Vérifiez l'antivirus** (peut bloquer certains fichiers)
4. **Exécutez en tant qu'administrateur**
5. **Vérifiez l'espace disque** (au moins 2 GB libres)

## 📞 Commandes de diagnostic Windows

```cmd
# Vérifier Node.js
node --version
npm --version

# Vérifier Expo
npx expo --version

# Vérifier les dépendances
npm list --depth=0

# Nettoyer complètement
rmdir /s /q node_modules .expo
del package-lock.json
npm install
```

Le script `fix-project-windows.bat` devrait résoudre automatiquement la plupart des problèmes sous Windows ! 🚀