@echo off
echo 🔧 Solution complète : Écran blanc APK Android
echo =============================================

echo.
echo 📋 Ce script va corriger le problème d'écran blanc
echo en recompilant l'APK avec le bundle JavaScript intégré.
echo.

if not exist package.json (
    echo ❌ package.json non trouvé
    echo Naviguez vers le dossier de votre projet
    pause
    exit /b 1
)

echo ✅ Projet détecté
echo.

echo 🧹 Étape 1: Nettoyage complet...
if exist android rmdir /s /q android
if exist .expo rmdir /s /q .expo
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 📦 Étape 2: Réinstallation des dépendances...
call npm install

echo.
echo 🔧 Étape 3: Régénération du projet Android AVEC bundle...
echo IMPORTANT: Cette fois SANS le flag --no-bundler
call npx expo run:android

if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    echo.
    echo 🔄 Essai avec EAS Build (méthode alternative)...
    call npx eas-cli build --platform android --profile production
    
    if %errorlevel% neq 0 (
        echo ❌ EAS Build aussi échoué
        echo.
        echo 🆘 Solutions manuelles :
        echo 1. Vérifiez votre connexion internet
        echo 2. Assurez-vous qu'un émulateur/appareil est connecté
        echo 3. Essayez : npx expo prebuild --platform android
        pause
        exit /b 1
    )
    
    echo ✅ EAS Build lancé ! APK sera disponible sur expo.dev
    goto :end
)

echo.
echo ✅ Compilation réussie avec bundle JavaScript !
echo.
echo 📱 L'APK est maintenant dans :
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 🔧 Pour une version release signée :
echo cd android
echo gradlew assembleRelease
echo.

:end
echo 📲 Installation sur appareil :
echo adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause