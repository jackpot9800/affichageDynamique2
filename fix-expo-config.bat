@echo off
echo 🔧 Correction de l'erreur de configuration Expo
echo =============================================

echo.
echo 📋 Diagnostic du problème...
echo L'erreur indique que expo-router n'est pas trouvé dans la configuration.

echo.
echo 🔧 Étape 1: Vérification des dépendances...
call npm list expo-router
if %errorlevel% neq 0 (
    echo ⚠️ expo-router manquant, installation...
    call npm install expo-router
)

echo.
echo 🔧 Étape 2: Vérification d'app.json...
if not exist app.json (
    echo ❌ app.json manquant !
    echo Création d'un app.json minimal...
    (
        echo {
        echo   "expo": {
        echo     "name": "Presentation Kiosk",
        echo     "slug": "presentation-kiosk-firetv",
        echo     "version": "1.0.0",
        echo     "orientation": "landscape",
        echo     "platforms": ["ios", "android", "web"],
        echo     "plugins": ["expo-router"]
        echo   }
        echo }
    ) > app.json
)

echo.
echo 🔧 Étape 3: Nettoyage et réinstallation...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
call npm install

echo.
echo 🔧 Étape 4: Vérification de la configuration Expo...
call npx expo config --json > nul

if %errorlevel% neq 0 (
    echo ❌ Problème de configuration persistant
    echo Utilisation de la méthode alternative...
    goto :alternative
)

echo ✅ Configuration Expo corrigée !
echo.
echo 🚀 Relancement d'EAS Build...
call npx @expo/eas-cli build --platform android --profile production
goto :end

:alternative
echo.
echo 🔄 MÉTHODE ALTERNATIVE : Build sans configuration complexe
echo.
echo Création d'un eas.json simplifié...
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

echo.
echo 🚀 Build avec configuration simplifiée...
call npx @expo/eas-cli build --platform android --profile production --non-interactive

:end
echo.
echo ✅ Script terminé !
pause