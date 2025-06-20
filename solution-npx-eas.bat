@echo off
echo 🚀 Solution NPX pour EAS CLI (évite tous les problèmes)
echo ====================================================

echo.
echo 📋 Cette méthode utilise npx et évite les problèmes d'installation
echo.

if not exist package.json (
    echo ❌ package.json non trouvé
    echo Naviguez vers le dossier de votre projet
    pause
    exit /b 1
)

echo ✅ Projet détecté
echo.

echo 🔑 Connexion avec npx...
call npx eas-cli login

if %errorlevel% neq 0 (
    echo ❌ Erreur de connexion
    pause
    exit /b 1
)

echo.
echo ⚙️ Configuration avec npx...
if not exist eas.json (
    call npx eas-cli build:configure
)

echo.
echo 🏗️ Build avec npx...
call npx eas-cli build --platform android --profile production

echo.
echo ✅ Build lancé avec npx !
echo Cette méthode évite tous les problèmes d'installation.
echo.
pause