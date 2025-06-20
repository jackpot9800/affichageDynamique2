@echo off
echo 🧪 Test du bundle JavaScript dans l'APK
echo ======================================

set /p APK_PATH="Chemin vers votre APK (ex: android\app\build\outputs\apk\debug\app-debug.apk): "

if not exist "%APK_PATH%" (
    echo ❌ APK non trouvé : %APK_PATH%
    pause
    exit /b 1
)

echo.
echo 🔍 Analyse de l'APK...

:: Créer un dossier temporaire pour extraire l'APK
mkdir temp_apk_extract 2>nul
cd temp_apk_extract

:: Extraire l'APK (c'est un fichier ZIP)
echo 📦 Extraction de l'APK...
powershell -command "Expand-Archive -Path '../%APK_PATH%' -DestinationPath '.' -Force"

echo.
echo 🔍 Recherche du bundle JavaScript...

if exist "assets\index.android.bundle" (
    echo ✅ Bundle JavaScript trouvé !
    echo Taille du bundle :
    dir "assets\index.android.bundle"
    echo.
    echo 🎉 L'APK contient le code JavaScript
    echo Le problème d'écran blanc vient d'ailleurs.
) else (
    echo ❌ Bundle JavaScript MANQUANT !
    echo.
    echo 🔧 SOLUTION : Recompilez SANS --no-bundler
    echo npx expo run:android
    echo.
    echo OU utilisez EAS Build :
    echo npx eas-cli build --platform android --profile production
)

echo.
echo 📋 Contenu de l'APK :
dir /s

cd ..
rmdir /s /q temp_apk_extract

echo.
pause