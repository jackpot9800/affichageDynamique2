@echo off
echo ⚡ Réparation rapide de build EAS
echo ===============================

echo.
echo 🧹 Nettoyage express...
if exist node_modules rmdir /s /q node_modules
call npm install

echo.
echo 🔧 Configuration minimale...
(
    echo {
    echo   "expo": {
    echo     "name": "Presentation Kiosk",
    echo     "slug": "presentation-kiosk-firetv",
    echo     "version": "1.0.0",
    echo     "platforms": ["android"],
    echo     "android": {
    echo       "package": "com.presentationkiosk.firetv"
    echo     },
    echo     "plugins": ["expo-router"]
    echo   }
    echo }
) > app.json

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
echo 🚀 Nouveau build...
call npx eas-cli build --platform android --profile production

echo.
echo ✅ Build relancé avec configuration simplifiée !
pause