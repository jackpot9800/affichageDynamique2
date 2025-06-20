# 📱 Guide d'importation GitHub vers Android Studio

## 🎯 Méthode 1: Import direct depuis GitHub dans Android Studio

### Étape 1: Cloner le repository
```bash
# Dans votre terminal
git clone https://github.com/votre-username/presentation-kiosk.git
cd presentation-kiosk
```

### Étape 2: Générer le projet Android natif
```bash
# Installer les dépendances
npm install

# Générer le projet Android natif avec Expo
npx expo run:android --no-install --no-bundler
```

Cette commande va créer un dossier `android/` avec le projet Android Studio complet.

### Étape 3: Ouvrir dans Android Studio
1. Lancez **Android Studio**
2. Choisissez **"Open an existing Android Studio project"**
3. Naviguez vers le dossier `android/` de votre projet
4. Cliquez sur **"Open"**

## 🎯 Méthode 2: Import direct depuis GitHub

### Dans Android Studio:
1. **File** → **New** → **Project from Version Control**
2. Sélectionnez **Git**
3. Entrez l'URL de votre repository GitHub
4. Choisissez le dossier de destination
5. Cliquez sur **Clone**

### Après le clonage:
```bash
# Dans le terminal d'Android Studio
npm install
npx expo run:android --no-install --no-bundler
```

## 🔧 Configuration pour Fire TV dans Android Studio

### Étape 1: Modifier le AndroidManifest.xml
Ouvrez `android/app/src/main/AndroidManifest.xml` et ajoutez :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions pour Fire TV -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Déclaration pour Android TV -->
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
        android:banner="@drawable/tv_banner"
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
                <!-- Ajout pour Android TV -->
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Étape 2: Créer un banner TV
Créez `android/app/src/main/res/drawable/tv_banner.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@mipmap/ic_launcher" />
```

### Étape 3: Configuration Gradle
Modifiez `android/app/build.gradle` :

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.yourcompany.presentationkiosk"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        // Configuration pour TV
        resConfigs "en", "fr"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
        debug {
            debuggable true
        }
    }
    
    // Configuration de signature
    signingConfigs {
        release {
            storeFile file('your-keystore.keystore')
            storePassword 'your-store-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
}
```

## 🔑 Génération de la clé de signature

### Dans Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Choisissez **APK**
3. Cliquez sur **Create new...** pour créer un keystore
4. Remplissez les informations :
   - **Key store path**: `android/app/your-keystore.keystore`
   - **Password**: Choisissez un mot de passe fort
   - **Key alias**: `presentation-kiosk-key`
   - **Key password**: Même mot de passe ou différent
   - **Validity**: 25 ans minimum

### Ou via ligne de commande:
```bash
cd android/app
keytool -genkey -v -keystore your-keystore.keystore -alias presentation-kiosk-key -keyalg RSA -keysize 2048 -validity 10000
```

## 🏗️ Build de l'APK dans Android Studio

### Méthode 1: Interface graphique
1. **Build** → **Generate Signed Bundle / APK**
2. Sélectionnez **APK**
3. Choisissez votre keystore
4. Sélectionnez **release**
5. Cliquez sur **Finish**

### Méthode 2: Gradle
```bash
# Dans le terminal d'Android Studio
cd android
./gradlew assembleRelease
```

L'APK sera généré dans : `android/app/build/outputs/apk/release/`

## 🚀 Déploiement direct depuis Android Studio

### Configuration ADB
1. **Tools** → **SDK Manager**
2. Onglet **SDK Tools**
3. Cochez **Android SDK Platform-Tools**
4. Cliquez sur **Apply**

### Connexion Fire TV
1. **Run** → **Edit Configurations**
2. Cliquez sur **+** → **Android App**
3. Dans **Target**, sélectionnez **USB Device**
4. Connectez votre Fire TV via ADB :

```bash
# Dans le terminal d'Android Studio
adb connect 192.168.1.XXX:5555
```

### Déploiement
1. Sélectionnez votre Fire TV dans la liste des appareils
2. Cliquez sur le bouton **Run** (▶️)
3. L'app sera installée et lancée automatiquement

## 🔧 Debugging sur Fire TV

### Logs en temps réel
```bash
# Dans le terminal d'Android Studio
adb logcat | grep -i "presentation"
```

### React Native Debugger
```bash
# Activer le debug menu sur Fire TV
adb shell input keyevent 82

# Ou secouer l'appareil virtuellement
adb shell input keyevent 46
```

### Chrome DevTools
1. Activez le debug dans l'app
2. Ouvrez Chrome et allez sur `chrome://inspect`
3. Votre app apparaîtra dans la liste

## 📦 Automatisation avec Gradle Tasks

### Créer des tâches personnalisées
Ajoutez dans `android/app/build.gradle` :

```gradle
task deployToFireTV(type: Exec) {
    dependsOn assembleRelease
    commandLine 'adb', 'install', '-r', 'build/outputs/apk/release/app-release.apk'
    doLast {
        exec {
            commandLine 'adb', 'shell', 'am', 'start', '-n', 'com.yourcompany.presentationkiosk/.MainActivity'
        }
    }
}

task connectFireTV(type: Exec) {
    commandLine 'adb', 'connect', '192.168.1.XXX:5555'
}
```

### Utilisation:
```bash
./gradlew connectFireTV
./gradlew deployToFireTV
```

## 🎨 Personnalisation avancée

### Icônes et ressources
1. Placez vos icônes dans `android/app/src/main/res/mipmap-*/`
2. Créez des ressources spécifiques TV dans `android/app/src/main/res/layout-television/`

### Thèmes personnalisés
Modifiez `android/app/src/main/res/values/styles.xml` :

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">@color/black</item>
        <item name="android:statusBarColor">@color/black</item>
        <item name="android:navigationBarColor">@color/black</item>
    </style>
</resources>
```

## 🔍 Optimisations spécifiques Fire TV

### ProGuard configuration
Créez `android/app/proguard-rules.pro` :

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Expo
-keep class expo.** { *; }

# Votre app
-keep class com.yourcompany.presentationkiosk.** { *; }

# Optimisations
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
```

## 📋 Checklist de validation

- [ ] Projet cloné depuis GitHub
- [ ] Dépendances npm installées
- [ ] Projet Android généré avec Expo
- [ ] AndroidManifest.xml configuré pour TV
- [ ] Keystore créé et configuré
- [ ] APK signé généré
- [ ] Fire TV connecté via ADB
- [ ] App déployée et testée
- [ ] Navigation télécommande fonctionnelle
- [ ] Performance validée

## 🆘 Résolution de problèmes

### Erreur de build Gradle
```bash
# Nettoyer le projet
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease
```

### Problème de signature
- Vérifiez que le keystore existe
- Vérifiez les mots de passe dans build.gradle
- Régénérez le keystore si nécessaire

### Fire TV non détecté
```bash
# Redémarrer ADB
adb kill-server
adb start-server
adb connect 192.168.1.XXX:5555
```

Cette approche vous donne un contrôle total sur le processus de build et vous permet de faire des modifications natives spécifiques à Fire TV si nécessaire ! 🔥📱