@echo off
echo 🚀 Méthodes alternatives de build
echo ===============================

echo.
echo Si EAS Build continue d'échouer, voici 3 alternatives :
echo.
echo 1. Build local avec Expo
echo 2. Export vers Android Studio
echo 3. Build avec Expo CLI classique
echo.
set /p choice="Choisissez une méthode (1, 2 ou 3): "

if "%choice%"=="1" goto :local_build
if "%choice%"=="2" goto :android_studio
if "%choice%"=="3" goto :expo_cli
goto :end

:local_build
echo.
echo 🔨 Build local avec Expo...
echo ATTENTION: Nécessite Android Studio ou un émulateur
echo.
call npx expo run:android --no-install --no-bundler
goto :end

:android_studio
echo.
echo 📱 Export vers Android Studio...
echo.
echo Génération du projet Android natif...
call npx expo prebuild --platform android --clear

echo.
echo ✅ Projet Android généré dans le dossier 'android/'
echo.
echo Prochaines étapes :
echo 1. Ouvrez Android Studio
echo 2. Ouvrez le dossier 'android/'
echo 3. Build → Generate Signed Bundle/APK
echo 4. Sélectionnez APK et suivez l'assistant
echo.
goto :end

:expo_cli
echo.
echo 🔧 Build avec Expo CLI classique...
echo.
call npm install -g @expo/cli
call npx expo build:android

:end
pause