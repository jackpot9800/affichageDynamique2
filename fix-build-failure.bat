@echo off
echo 🔧 Réparation d'échec de build EAS
echo =================================

echo.
echo 📋 Étape 1: Nettoyage complet...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .expo rmdir /s /q .expo

echo.
echo 📋 Étape 2: Réinstallation des dépendances...
call npm install

echo.
echo 📋 Étape 3: Vérification d'expo-router...
call npm list expo-router >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Installation d'expo-router...
    call npm install expo-router
)

echo.
echo 📋 Étape 4: Correction d'app.json...
echo Création d'un app.json optimisé pour EAS Build...
(
    echo {
    echo   "expo": {
    echo     "name": "Presentation Kiosk",
    echo     "slug": "presentation-kiosk-firetv",
    echo     "version": "1.0.0",
    echo     "orientation": "landscape",
    echo     "platforms": ["android"],
    echo     "android": {
    echo       "package": "com.presentationkiosk.firetv",
    echo       "versionCode": 1,
    echo       "permissions": [
    echo         "android.permission.INTERNET",
    echo         "android.permission.ACCESS_NETWORK_STATE"
    echo       ]
    echo     },
    echo     "plugins": ["expo-router"]
    echo   }
    echo }
) > app.json

echo.
echo 📋 Étape 5: Création d'eas.json optimisé...
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
    echo     },
    echo     "development": {
    echo       "developmentClient": true,
    echo       "distribution": "internal",
    echo       "android": {
    echo         "buildType": "apk"
    echo       }
    echo     }
    echo   }
    echo }
) > eas.json

echo.
echo 📋 Étape 6: Test de la configuration...
call npx expo config --json >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Configuration encore invalide
    echo Utilisation de la méthode alternative...
    goto :alternative
)

echo ✅ Configuration corrigée !
echo.
echo 🚀 Relancement du build EAS...
call npx eas-cli build --platform android --profile production
goto :end

:alternative
echo.
echo 🔄 MÉTHODE ALTERNATIVE : Build simplifié
echo.
echo Création d'un eas.json minimal...
(
    echo {
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
echo 🚀 Build avec configuration minimale...
call npx eas-cli build --platform android --profile production --non-interactive

:end
echo.
echo ✅ Build relancé !
pause