# 🔧 Solution : Écran blanc sur APK Android

## 🚨 Problème identifié
L'APK se compile correctement mais l'application reste blanche une fois installée sur l'appareil Android/Fire TV.

## ✅ Solutions par ordre de priorité

### Solution 1: Vérification du Metro Bundler
Le problème principal est souvent que le bundle JavaScript n'est pas inclus correctement dans l'APK.

```cmd
# Dans votre dossier de projet
npx expo export --platform android
npx expo run:android --no-bundler
```

### Solution 2: Build avec bundle intégré
```cmd
# Supprimez le flag --no-bundler
npx expo run:android

# OU pour EAS Build
eas build --platform android --profile production
```

### Solution 3: Configuration du bundle dans app.json
Ajoutez cette configuration dans votre `app.json` :

```json
{
  "expo": {
    "android": {
      "bundler": "metro",
      "jsEngine": "hermes"
    }
  }
}
```

### Solution 4: Vérification des logs Android
```cmd
# Connectez votre appareil et vérifiez les logs
adb logcat | findstr "ReactNative\|Expo\|JavaScript"

# Ou spécifiquement pour votre app
adb logcat | findstr "presentationkiosk"
```

## 🔍 Diagnostic du problème

### Vérification 1: Bundle JavaScript présent
```cmd
# Après compilation, vérifiez que le bundle existe
dir android\app\src\main\assets\index.android.bundle
```

### Vérification 2: Permissions dans AndroidManifest.xml
Vérifiez que ces permissions sont présentes dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

### Vérification 3: Configuration Hermes
Dans `android/app/build.gradle`, vérifiez :

```gradle
project.ext.react = [
    enableHermes: true
]
```

## 🚀 Solution complète étape par étape

### Étape 1: Nettoyage complet
```cmd
# Supprimez les dossiers de build
rmdir /s /q android
rmdir /s /q .expo
rmdir /s /q node_modules

# Réinstallez
npm install
```

### Étape 2: Régénération du projet Android
```cmd
# Régénérez le projet Android avec les bonnes configurations
npx expo prebuild --platform android --clear
```

### Étape 3: Modification du build.gradle
Éditez `android/app/build.gradle` et ajoutez :

```gradle
android {
    ...
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

project.ext.react = [
    enableHermes: true,
    bundleInRelease: true,
    bundleInDebug: true
]
```

### Étape 4: Build avec bundle
```cmd
# Build avec bundle JavaScript intégré
cd android
gradlew assembleRelease
```

### Étape 5: Installation et test
```cmd
# Installez l'APK
adb install app\build\outputs\apk\release\app-release.apk

# Vérifiez les logs en temps réel
adb logcat -c
adb logcat | findstr "ReactNative"
```

## 🔧 Solution alternative : EAS Build

Si le problème persiste, utilisez EAS Build qui gère automatiquement le bundling :

```cmd
# Installation d'EAS CLI
npm install -g @expo/eas-cli

# Configuration
eas build:configure

# Build avec configuration optimisée
eas build --platform android --profile production
```

## 🎯 Configuration spécifique Fire TV

### Ajout dans AndroidManifest.xml
```xml
<application
    android:name=".MainApplication"
    android:allowBackup="false"
    android:theme="@style/AppTheme">
    
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask"
        android:theme="@style/Theme.App.SplashScreen"
        android:screenOrientation="landscape">
        
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
            <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

### Configuration pour télécommande
Ajoutez dans `android/app/src/main/res/values/styles.xml` :

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">@color/splashscreen_bg</item>
    </style>
</resources>
```

## 🔍 Debug avancé

### Vérification du bundle
```cmd
# Vérifiez que le bundle JavaScript est créé
npx expo export --platform android --output-dir dist

# Le fichier dist/_expo/static/js/android-*.js doit exister
dir dist\_expo\static\js\
```

### Test en mode debug
```cmd
# Compilez en mode debug pour plus de logs
cd android
gradlew assembleDebug
adb install app\build\outputs\apk\debug\app-debug.apk
```

### Logs détaillés
```cmd
# Logs complets de l'application
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
adb logcat -s ReactNativeJS:V ReactNative:V
```

## 🆘 Si le problème persiste

### Option 1: Utiliser Expo Development Build
```cmd
# Créez un development build
eas build --profile development --platform android
```

### Option 2: Vérifier la configuration réseau
L'application pourrait avoir besoin d'une connexion réseau au démarrage. Vérifiez :
- La connexion WiFi de l'appareil
- Les paramètres de proxy
- Les restrictions de pare-feu

### Option 3: Test sur émulateur
```cmd
# Testez d'abord sur émulateur
emulator -avd FireTV_Emulator
adb wait-for-device
adb install app-release.apk
```

## 📱 Script de test automatique

Créez `test-apk.bat` :

```batch
@echo off
echo 🔍 Test automatique de l'APK

echo 📱 Installation de l'APK...
adb install -r android\app\build\outputs\apk\release\app-release.apk

echo 🚀 Lancement de l'application...
adb shell am start -n com.presentationkiosk.firetv/.MainActivity

echo 📋 Affichage des logs (Ctrl+C pour arrêter)...
adb logcat -s ReactNativeJS:V ReactNative:V ExpoModules:V
```

## ✅ Checklist de validation

- [ ] Bundle JavaScript présent dans l'APK
- [ ] Permissions correctes dans AndroidManifest.xml
- [ ] Hermes activé
- [ ] Mode release configuré correctement
- [ ] Logs Android sans erreurs JavaScript
- [ ] Test sur émulateur réussi
- [ ] Test sur appareil physique réussi

La cause principale de l'écran blanc sur APK est généralement l'absence du bundle JavaScript ou une mauvaise configuration du build. Suivez ces étapes dans l'ordre ! 🚀