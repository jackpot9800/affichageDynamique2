@echo off
echo 🔧 Réparation complète d'app.json
echo ===============================

echo.
echo 📋 Sauvegarde de l'ancien app.json...
if exist app.json (
    copy app.json app.json.backup
    echo ✅ Sauvegarde créée : app.json.backup
)

echo.
echo 🔧 Création d'un app.json correct pour Fire TV...
(
    echo {
    echo   "expo": {
    echo     "name": "Presentation Kiosk",
    echo     "slug": "presentation-kiosk-firetv",
    echo     "version": "1.0.0",
    echo     "orientation": "landscape",
    echo     "icon": "./assets/images/icon.png",
    echo     "userInterfaceStyle": "dark",
    echo     "newArchEnabled": true,
    echo     "platforms": ["android", "web"],
    echo     "android": {
    echo       "adaptiveIcon": {
    echo         "foregroundImage": "./assets/images/icon.png",
    echo         "backgroundColor": "#0a0a0a"
    echo       },
    echo       "package": "com.presentationkiosk.firetv",
    echo       "versionCode": 1,
    echo       "permissions": [
    echo         "android.permission.INTERNET",
    echo         "android.permission.ACCESS_NETWORK_STATE",
    echo         "android.permission.WAKE_LOCK"
    echo       ],
    echo       "intentFilters": [
    echo         {
    echo           "action": "android.intent.action.MAIN",
    echo           "category": [
    echo             "android.intent.category.LAUNCHER",
    echo             "android.intent.category.LEANBACK_LAUNCHER"
    echo           ]
    echo         }
    echo       ]
    echo     },
    echo     "web": {
    echo       "bundler": "metro",
    echo       "output": "single",
    echo       "favicon": "./assets/images/favicon.png"
    echo     },
    echo     "plugins": [
    echo       "expo-router",
    echo       "expo-font",
    echo       "expo-web-browser"
    echo     ],
    echo     "experiments": {
    echo       "typedRoutes": true
    echo     }
    echo   }
    echo }
) > app.json

echo ✅ app.json créé avec succès !
echo.
echo 🔧 Vérification de la configuration...
call npx expo config --json > nul

if %errorlevel% neq 0 (
    echo ❌ Problème de configuration
    echo Restauration de la sauvegarde...
    if exist app.json.backup (
        copy app.json.backup app.json
    )
) else (
    echo ✅ Configuration valide !
)

echo.
pause