@echo off
echo 📱 Installation APK sur Fire TV Stick
echo ====================================

set /p FIRE_TV_IP="Entrez l'IP de votre Fire TV (ex: 192.168.1.100): "
set /p APK_PATH="Chemin vers votre APK téléchargé (ex: presentation-kiosk.apk): "

echo.
echo 📱 Connexion au Fire TV...
adb connect %FIRE_TV_IP%:5555

if %errorlevel% neq 0 (
    echo ❌ Impossible de se connecter au Fire TV
    echo.
    echo 🔧 Vérifications :
    echo 1. Fire TV en mode développeur activé ?
    echo 2. ADB Debugging activé ?
    echo 3. IP correcte ?
    echo 4. Fire TV et PC sur le même réseau WiFi ?
    pause
    exit /b 1
)

echo ✅ Connexion réussie !
echo.

echo 🗑️ Désinstallation de l'ancienne version (si présente)...
adb uninstall com.presentationkiosk.firetv

echo.
echo 📦 Installation de la nouvelle APK...
adb install "%APK_PATH%"

if %errorlevel% neq 0 (
    echo ❌ Erreur d'installation
    echo.
    echo 🔧 Vérifications :
    echo 1. "Apps from Unknown Sources" activé ?
    echo 2. Fichier APK valide ?
    echo 3. Espace suffisant sur Fire TV ?
    pause
    exit /b 1
)

echo.
echo 🚀 Lancement de l'application...
adb shell am start -n com.presentationkiosk.firetv/.MainActivity

echo.
echo ✅ Installation terminée avec succès !
echo.
echo 📱 Votre application "Presentation Kiosk" est maintenant installée
echo et devrait apparaître dans les applications de votre Fire TV.
echo.
pause