@echo off
echo 🔧 Réparation APK écran blanc - Presentation Kiosk
echo ================================================

echo.
echo 🧹 Nettoyage complet du projet...
if exist android rmdir /s /q android
if exist .expo rmdir /s /q .expo
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 📦 Réinstallation des dépendances...
call npm install

echo.
echo 🔧 Régénération du projet Android avec bundle...
call npx expo prebuild --platform android --clear

echo.
echo ⚙️ Configuration du build pour inclure le bundle JavaScript...
(
    echo project.ext.react = [
    echo     enableHermes: true,
    echo     bundleInRelease: true,
    echo     bundleInDebug: true
    echo ]
    echo.
) >> android\app\build.gradle

echo.
echo 🏗️ Compilation de l'APK avec bundle intégré...
cd android
call gradlew clean
call gradlew assembleRelease
cd ..

echo.
echo ✅ APK compilé avec bundle JavaScript !
echo.
echo 📱 Pour installer sur Fire TV :
echo    adb connect 192.168.1.XXX:5555
echo    adb install android\app\build\outputs\apk\release\app-release.apk
echo.
echo 🔍 Pour vérifier les logs :
echo    adb logcat ^| findstr "ReactNative"
echo.
pause