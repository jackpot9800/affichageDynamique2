@echo off
echo 🔍 Diagnostic d'échec de build EAS
echo ================================

echo.
echo 📋 Vérifications de base...

echo 🔍 1. Vérification du projet Expo...
if not exist package.json (
    echo ❌ package.json manquant
    pause
    exit /b 1
)

echo ✅ package.json trouvé

echo.
echo 🔍 2. Vérification d'app.json...
if not exist app.json (
    echo ❌ app.json manquant
    pause
    exit /b 1
)

echo ✅ app.json trouvé

echo.
echo 🔍 3. Vérification des dépendances critiques...
call npm list expo-router >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ expo-router manquant
    echo Installation...
    call npm install expo-router
)

echo.
echo 🔍 4. Test de la configuration Expo...
call npx expo config --json >config-test.json 2>&1
if %errorlevel% neq 0 (
    echo ❌ Configuration Expo invalide
    echo Contenu de l'erreur :
    type config-test.json
    del config-test.json
) else (
    echo ✅ Configuration Expo valide
    del config-test.json
)

echo.
echo 🔍 5. Vérification d'eas.json...
if exist eas.json (
    echo ✅ eas.json présent
    echo Contenu :
    type eas.json
) else (
    echo ⚠️ eas.json manquant
)

echo.
echo 📋 DIAGNOSTIC TERMINÉ
echo.
pause