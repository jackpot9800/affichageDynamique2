@echo off
echo 🔍 Test de connectivité npm
echo ==========================

echo.
echo 📋 Test 1: Ping du registre npm...
ping -n 1 registry.npmjs.org

echo.
echo 📋 Test 2: Configuration npm actuelle...
echo Registre : 
npm config get registry
echo Cache : 
npm config get cache
echo Proxy : 
npm config get proxy

echo.
echo 📋 Test 3: Recherche du package @expo/eas-cli...
npm view @expo/eas-cli version

if %errorlevel% neq 0 (
    echo ❌ Package non trouvé - problème de connectivité
    echo.
    echo 🔧 Solutions :
    echo 1. Vérifiez votre connexion internet
    echo 2. Vérifiez les paramètres de proxy/firewall
    echo 3. Utilisez npx au lieu d'installer globalement
    echo.
    echo 🚀 Commande recommandée :
    echo npx @expo/eas-cli build --platform android --profile production
) else (
    echo ✅ Package trouvé - connectivité OK
    echo.
    echo 🔧 Le problème vient probablement de :
    echo 1. Cache npm corrompu
    echo 2. Permissions insuffisantes
    echo 3. Version npm obsolète
    echo.
    echo 🚀 Solutions :
    echo npm cache clean --force
    echo npm install -g @expo/eas-cli --force
    echo.
    echo 🎯 Ou utilisez npx (recommandé) :
    echo npx @expo/eas-cli build --platform android --profile production
)

echo.
pause