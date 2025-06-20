@echo off
echo 🚀 Build EAS final - Solution complète
echo ====================================

echo.
echo 📋 Étape 1: Vérification du projet...
if not exist package.json (
    echo ❌ package.json non trouvé
    echo Naviguez vers le dossier de votre projet
    pause
    exit /b 1
)

echo ✅ Projet détecté
echo.

echo 📋 Étape 2: Correction de la configuration...
call fix-app-json.bat

echo.
echo 📋 Étape 3: Réinstallation des dépendances...
if exist node_modules rmdir /s /q node_modules
call npm install

echo.
echo 📋 Étape 4: Vérification d'expo-router...
call npm list expo-router > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Installation d'expo-router...
    call npm install expo-router
)

echo.
echo 📋 Étape 5: Test de la configuration Expo...
call npx expo config --json > config-test.json 2>&1

if %errorlevel% neq 0 (
    echo ⚠️ Problème de configuration, utilisation de la méthode alternative...
    
    echo Création d'un eas.json minimal...
    (
        echo {
        echo   "cli": {
        echo     "version": ">= 3.0.0"
        echo   },
        echo   "build": {
        echo     "production": {
        echo       "android": {
        echo         "buildType": "apk"
        echo       }
        echo     }
        echo   }
        echo }
    ) > eas.json
    
    echo 🚀 Build avec configuration simplifiée...
    call npx @expo/eas-cli build --platform android --profile production --non-interactive
) else (
    echo ✅ Configuration OK !
    del config-test.json
    
    echo 🚀 Build EAS normal...
    call npx @expo/eas-cli build --platform android --profile production
)

echo.
echo ✅ Build lancé !
echo.
echo 📱 Prochaines étapes :
echo 1. Attendez la fin du build (5-15 minutes)
echo 2. Connectez-vous sur https://expo.dev
echo 3. Téléchargez votre APK
echo 4. Installez sur Fire TV
echo.
pause