@echo off
echo 🚀 Build APK avec EAS CLI (version correcte)
echo ==========================================

echo.
echo 📋 Vérification du projet...
if not exist package.json (
    echo ❌ package.json non trouvé
    echo Naviguez vers le dossier de votre projet
    pause
    exit /b 1
)

echo ✅ Projet détecté
echo.

echo 🔑 Connexion à Expo...
call eas login

if %errorlevel% neq 0 (
    echo ❌ Erreur de connexion
    echo Essayez : npx eas-cli login
    pause
    exit /b 1
)

echo.
echo ⚙️ Configuration du projet...
if not exist eas.json (
    echo Configuration EAS manquante, création...
    call eas build:configure
)

echo.
echo 🏗️ Lancement du build APK...
echo.
echo Quel profil de build ?
echo 1. Production (optimisé, signé)
echo 2. Development (avec debug)
echo.
set /p choice="Votre choix (1 ou 2): "

if "%choice%"=="1" (
    echo 🔨 Build production...
    call eas build --platform android --profile production
) else (
    echo 🔨 Build development...
    call eas build --platform android --profile development
)

echo.
echo ✅ Build lancé !
echo.
echo 📱 Une fois terminé :
echo 1. Connectez-vous sur https://expo.dev
echo 2. Téléchargez votre APK
echo 3. Installez sur Fire TV : adb install presentation-kiosk.apk
echo.
pause