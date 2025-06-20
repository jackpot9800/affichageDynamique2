@echo off
echo 🔍 Diagnostic complet npm/Node.js
echo ===============================

echo.
echo 📋 Informations système :
echo OS : %OS%
echo Utilisateur : %USERNAME%
echo.

echo 🔍 Versions installées :
echo.
echo Node.js :
node --version
echo.
echo npm :
npm --version
echo.

echo 🔍 Configuration npm :
echo.
echo Registre npm :
npm config get registry
echo.
echo Cache npm :
npm config get cache
echo.
echo Dossier global :
npm config get prefix
echo.

echo 🔍 Proxy (si configuré) :
npm config get proxy
npm config get https-proxy
echo.

echo 🔍 Test de connectivité :
echo Test ping registry.npmjs.org...
ping -n 1 registry.npmjs.org

echo.
echo 🔍 Test recherche package @expo/eas-cli :
npm search @expo/eas-cli --no-description

echo.
echo 🔍 Informations détaillées :
npm config list

echo.
echo 📋 RÉSUMÉ DU DIAGNOSTIC :
echo ========================
echo.
echo Si vous voyez des erreurs ci-dessus :
echo 1. Problème de réseau/proxy → Configurez le proxy
echo 2. Registre incorrect → npm config set registry https://registry.npmjs.org/
echo 3. Cache corrompu → npm cache clean --force
echo 4. Version Node.js trop ancienne → Mettez à jour Node.js
echo.
echo SOLUTION RECOMMANDÉE : Utilisez npx au lieu d'installer globalement
echo npx @expo/eas-cli build --platform android --profile production
echo.
pause