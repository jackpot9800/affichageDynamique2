@echo off
echo 📱 Installation APK corrigé sur appareil
echo ======================================

echo.
echo 📋 Ce script installe l'APK avec bundle JavaScript
echo sur votre appareil Android ou Fire TV.
echo.

set /p DEVICE_IP="IP de votre appareil (Fire TV) ou laissez vide pour USB: "

if "%DEVICE_IP%"=="" (
    echo 🔌 Connexion USB...
    adb devices
) else (
    echo 📡 Connexion WiFi...
    adb connect %DEVICE_IP%:5555
)

echo.
echo 📦 Recherche de l'APK...

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
    echo ✅ APK debug trouvé
) else if exist "android\app\build\outputs\apk\release\app-release.apk" (
    set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
    echo ✅ APK release trouvé
) else (
    echo ❌ Aucun APK trouvé
    echo Compilez d'abord avec : npx expo run:android
    pause
    exit /b 1
)

echo.
echo 🗑️ Désinstallation de l'ancienne version...
adb uninstall com.presentationkiosk.firetv

echo.
echo 📲 Installation du nouvel APK...
adb install "%APK_PATH%"

if %errorlevel% neq 0 (
    echo ❌ Erreur d'installation
    pause
    exit /b 1
)

echo.
echo 🚀 Lancement de l'application...
adb shell am start -n com.presentationkiosk.firetv/.MainActivity

echo.
echo 🧪 Test de l'écran blanc...
echo Si l'application reste blanche, vérifiez les logs :
echo.
timeout /t 3 /nobreak >nul
adb logcat -s ReactNativeJS:V ReactNative:V | findstr "Bundle\|JavaScript\|Error" 

echo.
echo ✅ Installation terminée !
echo.
pause