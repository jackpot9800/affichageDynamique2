@echo off
echo 🚀 Build APK simple avec npx
echo ===========================

echo.
echo 📋 Cette méthode évite tous les problèmes d'installation EAS CLI
echo.

:: Vérifier si on est dans un projet Expo
if not exist package.json (
    echo ❌ package.json non trouvé
    echo Naviguez vers le dossier de votre projet Expo
    pause
    exit /b 1
)

echo ✅ Projet Expo détecté
echo.

echo 🔑 Étape 1: Connexion à Expo...
call npx @expo/eas-cli login

if %errorlevel% neq 0 (
    echo ❌ Erreur de connexion
    echo Vérifiez votre connexion internet
    pause
    exit /b 1
)

echo ✅ Connexion réussie
echo.

echo ⚙️ Étape 2: Configuration du projet...
if not exist eas.json (
    echo Configuration EAS manquante, création automatique...
    call npx @expo/eas-cli build:configure
    
    if %errorlevel% neq 0 (
        echo ❌ Erreur de configuration
        pause
        exit /b 1
    )
)

echo ✅ Configuration OK
echo.

echo 🏗️ Étape 3: Lancement du build APK...
echo.
echo 🎯 Build production (optimisé pour Fire TV)
call npx @expo/eas-cli build --platform android --profile production

echo.
echo ✅ Build lancé avec succès !
echo.
echo 📱 Prochaines étapes :
echo 1. Attendez la fin du build (5-15 minutes)
echo 2. Connectez-vous sur https://expo.dev
echo 3. Téléchargez votre APK
echo 4. Installez sur Fire TV :
echo    adb connect 192.168.1.XXX:5555
echo    adb install presentation-kiosk.apk
echo.
echo 🌐 Lien direct : https://expo.dev
echo.
pause