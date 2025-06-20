@echo off
echo 🚀 Build APK rapide avec EAS (Windows)
echo ====================================

echo.
echo 📋 Vérifications préliminaires...

:: Vérifier si on est dans un projet Expo
if not exist package.json (
    echo ❌ package.json non trouvé
    echo Assurez-vous d'être dans le dossier du projet
    pause
    exit /b 1
)

:: Vérifier si EAS CLI est installé
call eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ EAS CLI non trouvé, installation...
    call npm install -g @expo/eas-cli
    
    :: Vérifier à nouveau
    call eas --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Impossible d'installer EAS CLI
        echo Essayez : npx @expo/eas-cli build --platform android
        pause
        exit /b 1
    )
)

echo ✅ EAS CLI installé

echo.
echo 🔑 Connexion à Expo (si nécessaire)...
call eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Vous devez vous connecter à Expo
    call eas login
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
echo Quel type de build voulez-vous ?
echo 1. Production (optimisé, pour distribution)
echo 2. Development (avec debug, pour tests)
echo 3. Preview (intermédiaire)
echo.
set /p buildtype="Votre choix (1, 2 ou 3): "

if "%buildtype%"=="1" (
    echo 🔨 Build production en cours...
    call eas build --platform android --profile production
) else if "%buildtype%"=="2" (
    echo 🔨 Build development en cours...
    call eas build --platform android --profile development
) else if "%buildtype%"=="3" (
    echo 🔨 Build preview en cours...
    call eas build --platform android --profile preview
) else (
    echo ❌ Choix invalide, build production par défaut
    call eas build --platform android --profile production
)

echo.
echo ✅ Build terminé !
echo.
echo 📱 Pour installer sur Fire TV :
echo 1. Téléchargez l'APK depuis votre compte Expo
echo 2. adb connect 192.168.1.XXX:5555
echo 3. adb install presentation-kiosk.apk
echo.
echo 🌐 Ou visitez : https://expo.dev/accounts/[votre-compte]/projects
echo.
pause