@echo off
echo 🔧 Installation et configuration EAS CLI (Windows)
echo ================================================

echo.
echo 📦 Installation correcte d'EAS CLI...
call npm install -g @expo/eas-cli

if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation d'EAS CLI
    echo.
    echo 🔄 Tentative avec cache nettoyé...
    call npm cache clean --force
    call npm install -g @expo/eas-cli
)

echo.
echo ✅ Vérification de l'installation...
call eas --version

if %errorlevel% neq 0 (
    echo ❌ EAS CLI non accessible
    echo.
    echo 🔧 Solutions possibles :
    echo 1. Redémarrez PowerShell/CMD
    echo 2. Vérifiez les variables d'environnement PATH
    echo 3. Exécutez en tant qu'administrateur
    pause
    exit /b 1
)

echo.
echo 🔑 Connexion à Expo...
call eas login

echo.
echo ⚙️ Configuration du projet pour EAS Build...
if not exist eas.json (
    call eas build:configure
)

echo.
echo 🏗️ Lancement du build APK...
echo Choisissez votre profil de build :
echo 1. Development (pour tests)
echo 2. Production (pour distribution)
echo.
set /p choice="Votre choix (1 ou 2): "

if "%choice%"=="1" (
    echo 🔨 Build development...
    call eas build --platform android --profile development
) else (
    echo 🔨 Build production...
    call eas build --platform android --profile production
)

echo.
echo ✅ Build terminé !
echo Votre APK sera téléchargeable depuis votre compte Expo.
echo.
pause