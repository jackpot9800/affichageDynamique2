@echo off
echo 🧪 Test de l'application sur Fire TV
echo ==================================

set /p FIRE_TV_IP="IP de votre Fire TV: "

echo.
echo 📱 Connexion au Fire TV...
adb connect %FIRE_TV_IP%:5555

echo.
echo 🚀 Lancement de l'application...
adb shell am start -n com.presentationkiosk.firetv/.MainActivity

echo.
echo 📋 Affichage des logs en temps réel...
echo (Appuyez sur Ctrl+C pour arrêter)
echo.
echo Recherchez ces éléments dans les logs :
echo ✅ "API Service initialized"
echo ✅ "Presentations loaded"
echo ❌ Erreurs JavaScript ou de réseau
echo.
adb logcat -s ReactNativeJS:V ReactNative:V ExpoModules:V

pause