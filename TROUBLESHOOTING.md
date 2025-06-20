# 🔧 Guide de dépannage - Build Android

## 🚨 Erreurs courantes et solutions

### 1. "No Android connected device found"

**Cause :** Aucun émulateur ou appareil physique n'est connecté.

**Solutions :**

#### Option A: Créer et démarrer un émulateur
```bash
# Créer un émulateur Fire TV
avdmanager create avd -n FireTV_Emulator -k "system-images;android-30;google_apis;x86_64" -d "tv_1080p"

# Démarrer l'émulateur
emulator -avd FireTV_Emulator
```

#### Option B: Connecter un Fire TV physique
```bash
# Sur le Fire TV: Paramètres → My Fire TV → Developer Options
# Activez ADB Debugging

# Connecter via WiFi (remplacez l'IP)
adb connect 192.168.1.XXX:5555

# Vérifier la connexion
adb devices
```

#### Option C: Utiliser EAS Build (cloud)
```bash
npm install -g @expo/eas-cli
eas login
eas build --platform android --profile production
```

### 2. "ANDROID_HOME not set"

**Solution :**
```bash
# Ajouter à ~/.bashrc ou ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools

# Recharger le shell
source ~/.bashrc
```

### 3. "SDK not found"

**Solution :**
1. Installez Android Studio
2. Ouvrez SDK Manager
3. Installez Android SDK Platform-Tools
4. Installez au moins une image système (API 30+)

### 4. "Emulator not starting"

**Solutions :**
```bash
# Vérifier la virtualisation
# Sur Windows: Activer Hyper-V ou HAXM
# Sur Mac: Aucune action nécessaire
# Sur Linux: Installer KVM

# Démarrer avec plus de mémoire
emulator -avd FireTV_Emulator -memory 2048 -cores 4

# Utiliser le GPU host
emulator -avd FireTV_Emulator -gpu host
```

### 5. "Build failed with Gradle"

**Solutions :**
```bash
# Nettoyer le cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease

# Si problème de mémoire
export GRADLE_OPTS="-Xmx4g -XX:MaxPermSize=512m"
```

### 6. "Fire TV not detected via ADB"

**Solutions :**
```bash
# Redémarrer ADB
adb kill-server
adb start-server

# Vérifier l'IP du Fire TV
# Paramètres → My Fire TV → About → Network

# Reconnecter
adb connect 192.168.1.XXX:5555

# Autoriser sur Fire TV si demandé
```

### 7. "Permission denied" sur Fire TV

**Solution :**
1. Fire TV → Paramètres → My Fire TV → Developer Options
2. Activez "Apps from Unknown Sources"
3. Activez "ADB Debugging"
4. Autorisez l'ordinateur quand demandé

### 8. "Metro bundler not starting"

**Solution :**
```bash
# Nettoyer le cache Metro
npx expo start --clear

# Ou utiliser --no-bundler
npx expo run:android --no-bundler
```

### 9. "Out of memory" pendant le build

**Solutions :**
```bash
# Augmenter la mémoire Gradle
echo "org.gradle.jvmargs=-Xmx4g" >> android/gradle.properties

# Ou utiliser EAS Build
eas build --platform android
```

### 10. "Keystore not found" pour APK signé

**Solution :**
```bash
# Créer un keystore
keytool -genkey -v -keystore presentation-kiosk.keystore -alias presentation-kiosk-key -keyalg RSA -keysize 2048 -validity 10000

# Configurer dans android/app/build.gradle
```

## 🛠️ Commandes de diagnostic

```bash
# Vérifier l'environnement
echo "ANDROID_HOME: $ANDROID_HOME"
which adb
which emulator

# Lister les émulateurs
emulator -list-avds

# Vérifier les appareils
adb devices

# Vérifier les packages SDK
sdkmanager --list | grep "system-images"

# Logs détaillés
adb logcat | grep -i "presentation"

# Informations système
adb shell getprop ro.build.version.release
```

## 🚀 Solutions rapides par scénario

### Scénario 1: Premier build, pas d'émulateur
```bash
# Solution rapide avec EAS
npm install -g @expo/eas-cli
eas login
eas build --platform android --profile production
```

### Scénario 2: Développement local avec émulateur
```bash
# Setup complet
./setup-android.sh
# Ou manuellement:
avdmanager create avd -n FireTV -k "system-images;android-30;google_apis;x86_64" -d "tv_1080p"
emulator -avd FireTV &
adb wait-for-device
npx expo run:android
```

### Scénario 3: Test sur Fire TV réel
```bash
# Configuration Fire TV + build
adb connect 192.168.1.XXX:5555
npx expo run:android --device
```

### Scénario 4: APK pour distribution
```bash
# Build optimisé
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

## 📞 Ressources d'aide

- **Documentation Expo :** https://docs.expo.dev/
- **Android Developer :** https://developer.android.com/
- **Fire TV Developer :** https://developer.amazon.com/fire-tv
- **EAS Build :** https://docs.expo.dev/build/introduction/

## 🔄 Script de reset complet

Si tout échoue, utilisez ce script pour repartir de zéro :

```bash
#!/bin/bash
echo "🔄 Reset complet du projet Android"

# Nettoyer les caches
rm -rf node_modules
rm -rf android
rm -rf .expo

# Réinstaller
npm install

# Regenerer le projet Android
npx expo prebuild --platform android --clear

echo "✅ Reset terminé, vous pouvez relancer le build"
```