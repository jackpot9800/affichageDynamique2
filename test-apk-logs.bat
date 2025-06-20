@echo off
echo 📱 Test et diagnostic APK - Presentation Kiosk
echo ============================================

set /p FIRE_TV_IP="Entrez l'IP de votre Fire TV (ex: 192.168.1.100): "

echo.
echo 📱 Connexion au Fire TV...
adb connect %FIRE_TV_IP%:5555

echo.
echo 🗑️ Désinstallation de l'ancienne version...
adb uninstall com.presentationkiosk.firetv

echo.
echo 📦 Installation de la nouvelle APK...
adb install -r android\app\build\outputs\apk\release\app-release.apk

if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des logs...
adb logcat -c

echo.
echo 🚀 Lancement de l'application...
adb shell am start -n com.presentationkiosk.firetv/.MainActivity

echo.
echo 📋 Affichage des logs en temps réel...
echo (Appuyez sur Ctrl+C pour arrêter)
echo.
adb logcat -s ReactNativeJS:V ReactNative:V ExpoModules:V MainApplication:V

pause