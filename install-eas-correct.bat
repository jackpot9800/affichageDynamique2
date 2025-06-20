@echo off
echo 🔧 Installation correcte d'EAS CLI
echo =================================

echo.
echo 📋 Le problème : Vous essayez d'installer @expo/eas-cli
echo ✅ La solution : Le package correct est eas-cli (sans @expo/)
echo.

echo 🧹 Nettoyage du cache npm...
call npm cache clean --force

echo.
echo 📦 Installation du bon package...
call npm install -g eas-cli

if %errorlevel% neq 0 (
    echo ❌ Erreur d'installation, essai avec force...
    call npm install -g eas-cli --force
)

echo.
echo ✅ Vérification de l'installation...
call eas --version

if %errorlevel% neq 0 (
    echo ❌ Installation échouée
    echo.
    echo 🔄 SOLUTION ALTERNATIVE : Utilisez npx
    echo npx eas-cli login
    echo npx eas-cli build --platform android --profile production
    pause
    exit /b 1
)

echo.
echo 🎉 EAS CLI installé avec succès !
echo.
echo 🚀 Prochaines étapes :
echo 1. eas login
echo 2. eas build:configure
echo 3. eas build --platform android --profile production
echo.
pause