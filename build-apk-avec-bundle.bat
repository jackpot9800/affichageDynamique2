@echo off
echo 🏗️ Build APK avec bundle JavaScript intégré
echo ==========================================

echo.
echo 📋 Cette méthode garantit que le code JavaScript
echo sera inclus dans l'APK (résout l'écran blanc).
echo.

if not exist package.json (
    echo ❌ package.json non trouvé
    pause
    exit /b 1
)

echo ✅ Projet détecté
echo.

echo 🔧 Méthode de build :
echo 1. Expo run:android (avec bundle)
echo 2. EAS Build (cloud)
echo 3. Prebuild + Android Studio
echo.
set /p choice="Votre choix (1, 2 ou 3): "

if "%choice%"=="1" goto :expo_run
if "%choice%"=="2" goto :eas_build
if "%choice%"=="3" goto :prebuild
goto :end

:expo_run
echo.
echo 🔨 Build avec Expo (bundle intégré)...
echo IMPORTANT: SANS --no-bundler cette fois !
call npx expo run:android

if %errorlevel% neq 0 (
    echo ❌ Erreur de build
    echo Vérifiez qu'un émulateur/appareil est connecté
    pause
    exit /b 1
)

echo ✅ Build réussi avec bundle !
echo APK : android\app\build\outputs\apk\debug\app-debug.apk
goto :end

:eas_build
echo.
echo ☁️ Build EAS (cloud)...
call npx eas-cli build --platform android --profile production

echo ✅ Build EAS lancé !
echo APK sera téléchargeable depuis expo.dev
goto :end

:prebuild
echo.
echo 📱 Prebuild + Android Studio...
call npx expo prebuild --platform android --clear

echo ✅ Projet Android généré !
echo.
echo Prochaines étapes :
echo 1. Ouvrez Android Studio
echo 2. Ouvrez le dossier 'android\'
echo 3. Build → Generate Signed Bundle/APK
echo 4. IMPORTANT: Assurez-vous que bundleInRelease = true
goto :end

:end
echo.
pause