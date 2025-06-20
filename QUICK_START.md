# 🚀 Guide Rapide : Export → Android Studio → APK

## 📥 1. Export depuis Bolt
- Cliquez sur **Download/Export** dans Bolt
- Téléchargez le ZIP du projet
- Extrayez dans un dossier

## 🔧 2. Préparation
```bash
cd presentation-kiosk
npm install
npx expo run:android --no-install --no-bundler
```

## 📱 3. Android Studio
1. Ouvrez Android Studio
2. **Open existing project** → Sélectionnez le dossier `android/`
3. Attendez la synchronisation Gradle

## 🔑 4. Signature APK
1. **Build** → **Generate Signed Bundle/APK**
2. **APK** → **Create new keystore**
3. Remplissez les infos et sauvegardez le keystore

## 🏗️ 5. Compilation
1. **Build** → **Generate Signed Bundle/APK**
2. Sélectionnez votre keystore
3. **Release** → **Finish**

## 📲 6. Installation Fire TV
```bash
# Activez le mode développeur sur Fire TV
# Paramètres → My Fire TV → Developer Options
# Activez ADB Debugging + Apps from Unknown Sources

# Installez via ADB
adb connect 192.168.1.XXX:5555
adb install app-release.apk
```

## ✅ Résultat
APK prêt dans : `android/app/build/outputs/apk/release/app-release.apk`

**Taille** : ~15-25 MB  
**Compatible** : Fire TV Stick, Android TV, tablettes Android