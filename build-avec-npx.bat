@echo off
echo 🚀 Build APK avec npx (Solution alternative)
echo ==========================================

echo.
echo 📋 Cette méthode utilise npx au lieu d'installer EAS CLI globalement
echo Cela évite les problèmes d'installation et de permissions.
echo.

:: Vérifier si on est dans un projet Expo
if not exist package.json (
    echo ❌ package.json non trouvé
    echo Assurez-vous d'être dans le dossier du projet
    pause
    exit /b 1
)

echo 🔑 Connexion à Expo...
call npx @expo/eas-cli login

if %errorlevel% neq 0 (
    echo ❌ Erreur de connexion
    echo Vérifiez votre connexion internet
    pause
    exit /b 1
)

echo.
echo ⚙️ Configuration du projet...
if not exist eas.json (
    echo Configuration EAS manquante, création...
    call npx @expo/eas-cli build:configure
)

echo.
echo 🏗️ Lancement du build APK...
echo.
echo Quel profil de build ?
echo 1. Production (optimisé, signé automatiquement)
echo 2. Development (avec debug)
echo 3. Preview (test rapide)
echo.
set /p choice="Votre choix (1, 2 ou 3): "

if "%choice%"=="1" (
    echo 🔨 Build production...
    call npx @expo/eas-cli build --platform android --profile production
) else if "%choice%"=="2" (
    echo 🔨 Build development...
    call npx @expo/eas-cli build --platform android --profile development
) else if "%choice%"=="3" (
    echo 🔨 Build preview...
    call npx @expo/eas-cli build --platform android --profile preview
) else (
    echo ❌ Choix invalide, build production par défaut
    call npx @expo/eas-cli build --platform android --profile production
)

echo.
echo ✅ Build lancé !
echo.
echo 📱 Une fois terminé :
echo 1. Connectez-vous sur https://expo.dev
echo 2. Téléchargez votre APK
echo 3. Installez sur Fire TV : adb install presentation-kiosk.apk
echo.
echo 🔗 Lien direct : https://expo.dev/accounts/[votre-compte]/projects
echo.
pause