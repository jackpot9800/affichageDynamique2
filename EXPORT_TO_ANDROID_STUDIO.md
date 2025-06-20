# 📱 Guide d'Export et Compilation APK avec Android Studio

## 🎯 Méthode recommandée : Export ZIP → Android Studio

### Étape 1: Export du projet depuis Bolt
1. Cliquez sur le bouton **"Download"** ou **"Export"** dans Bolt
2. Téléchargez le projet au format ZIP
3. Extrayez le ZIP dans un dossier de votre choix

### Étape 2: Préparation du projet Expo
```bash
# Naviguez vers le dossier du projet
cd presentation-kiosk

# Installez les dépendances
npm install

# Générez le projet Android natif
npx expo run:android --no-install --no-bundler
```

Cette commande va créer un dossier `android/` avec tout le code natif Android.

### Étape 3: Ouverture dans Android Studio
1. Lancez **Android Studio**
2. Choisissez **"Open an existing Android Studio project"**
3. Naviguez vers le dossier `android/` de votre projet
4. Cliquez sur **"Open"**

## 🔧 Configuration spécifique Fire TV

### Modification du AndroidManifest.xml
Une fois dans Android Studio, modifiez `android/app/src/main/AndroidManifest.xml` :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions essentielles -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Support Android TV / Fire TV -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:banner="@mipmap/ic_launcher"
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
                <!-- Support Fire TV -->
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Configuration du build.gradle
Modifiez `android/app/build.gradle` pour optimiser pour Fire TV :

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.presentationkiosk.firetv"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        // Optimisations
        resConfigs "en", "fr"
        vectorDrawables.useSupportLibrary = true
    }
    
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
    
    // Configuration de signature (à créer)
    signingConfigs {
        release {
            storeFile file('presentation-kiosk.keystore')
            storePassword 'VotreMotDePasse123'
            keyAlias 'presentation-kiosk-key'
            keyPassword 'VotreMotDePasse123'
        }
    }
}
```

## 🔑 Création de la clé de signature

### Dans Android Studio :
1. **Build** → **Generate Signed Bundle / APK**
2. Sélectionnez **APK**
3. Cliquez sur **Create new...** pour créer un keystore
4. Remplissez les informations :
   - **Key store path** : `android/app/presentation-kiosk.keystore`
   - **Password** : Choisissez un mot de passe sécurisé
   - **Key alias** : `presentation-kiosk-key`
   - **Validity** : 25 ans
   - **First and Last Name** : Votre nom/société
   - **Organization** : Votre organisation
   - **Country** : FR

### Ou via terminal :
```bash
cd android/app
keytool -genkey -v -keystore presentation-kiosk.keystore -alias presentation-kiosk-key -keyalg RSA -keysize 2048 -validity 10000
```

## 🏗️ Compilation de l'APK

### Méthode 1 : Interface Android Studio
1. **Build** → **Generate Signed Bundle / APK**
2. Sélectionnez **APK**
3. Choisissez votre keystore créé précédemment
4. Sélectionnez **release**
5. Cochez **V1 (Jar Signature)** et **V2 (Full APK Signature)**
6. Cliquez sur **Finish**

L'APK sera généré dans : `android/app/build/outputs/apk/release/`

### Méthode 2 : Terminal
```bash
cd android
./gradlew assembleRelease
```

## 📲 Installation sur Fire TV Stick

### Préparation du Fire TV
1. **Paramètres** → **My Fire TV** → **Developer Options**
2. Activez **ADB Debugging**
3. Activez **Apps from Unknown Sources**

### Installation via ADB
```bash
# Connectez-vous au Fire TV (remplacez par votre IP)
adb connect 192.168.1.XXX:5555

# Installez l'APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Lancez l'application
adb shell am start -n com.presentationkiosk.firetv/.MainActivity
```

### Installation via Downloader App
1. Installez **Downloader** depuis l'Amazon Appstore
2. Uploadez votre APK sur Google Drive ou Dropbox
3. Obtenez le lien de téléchargement direct
4. Utilisez Downloader pour télécharger et installer

## 🎯 Optimisations spécifiques

### Créer un fichier ProGuard
Créez `android/app/proguard-rules.pro` :

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo
-keep class expo.** { *; }
-keep class versioned.host.exp.exponent.** { *; }

# Application
-keep class com.presentationkiosk.firetv.** { *; }

# Optimisations
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify
```

### Configuration pour la télécommande Fire TV
Ajoutez dans votre composant principal React Native :

```typescript
import { useEffect } from 'react';
import { BackHandler, TVEventHandler } from 'react-native';

export default function App() {
  useEffect(() => {
    // Gestion du bouton retour
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Empêcher la fermeture accidentelle
      return true;
    });

    // Gestion des événements TV (D-pad)
    const tvEventHandler = new TVEventHandler();
    tvEventHandler.enable(null, (cmp, evt) => {
      if (evt && evt.eventType === 'right') {
        // Navigation droite
      } else if (evt && evt.eventType === 'left') {
        // Navigation gauche
      } else if (evt && evt.eventType === 'select') {
        // Bouton OK/Select
      }
    });

    return () => {
      backHandler.remove();
      tvEventHandler.disable();
    };
  }, []);
}
```

## 🚀 Script d'automatisation

Créez un script `deploy-firetv.bat` (Windows) ou `deploy-firetv.sh` (Mac/Linux) :

```bash
#!/bin/bash
echo "🔥 Déploiement automatique sur Fire TV Stick"

# Variables
FIRE_TV_IP="192.168.1.XXX"  # Remplacez par votre IP
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
PACKAGE_NAME="com.presentationkiosk.firetv"

# Build
echo "📦 Compilation de l'APK..."
cd android && ./gradlew assembleRelease && cd ..

# Connexion
echo "📱 Connexion au Fire TV..."
adb connect $FIRE_TV_IP:5555

# Désinstallation ancienne version
echo "🗑️ Désinstallation ancienne version..."
adb uninstall $PACKAGE_NAME

# Installation
echo "⬇️ Installation nouvelle version..."
adb install $APK_PATH

# Lancement
echo "🚀 Lancement de l'application..."
adb shell am start -n $PACKAGE_NAME/.MainActivity

echo "✅ Déploiement terminé!"
```

## 📋 Checklist de validation

- [ ] Projet exporté depuis Bolt
- [ ] Dépendances npm installées
- [ ] Projet Android généré avec `expo run:android`
- [ ] Android Studio ouvert sur le dossier `android/`
- [ ] AndroidManifest.xml configuré pour Fire TV
- [ ] Keystore créé et configuré
- [ ] build.gradle configuré
- [ ] APK release compilé et signé
- [ ] Fire TV en mode développeur
- [ ] ADB configuré et connecté
- [ ] APK installé et testé sur Fire TV

## 🆘 Résolution de problèmes courants

### Erreur "SDK not found"
```bash
# Dans Android Studio, allez dans File → Project Structure → SDK Location
# Assurez-vous que le SDK Android est correctement configuré
```

### Erreur de signature
- Vérifiez que le fichier keystore existe
- Vérifiez les mots de passe dans build.gradle
- Régénérez le keystore si nécessaire

### Fire TV non détecté
```bash
# Redémarrez ADB
adb kill-server
adb start-server
adb connect 192.168.1.XXX:5555
```

### APK trop volumineux
- Activez `minifyEnabled true` dans build.gradle
- Activez `shrinkResources true`
- Utilisez ProGuard pour optimiser

## 🎉 Résultat final

Vous obtiendrez un fichier APK optimisé pour Fire TV Stick que vous pourrez :
- Installer directement via ADB
- Distribuer à d'autres Fire TV Sticks
- Publier sur Amazon Appstore (après validation)
- Installer via sideloading

L'APK final sera dans : `android/app/build/outputs/apk/release/app-release.apk`

Taille approximative : 15-25 MB (optimisé avec ProGuard)