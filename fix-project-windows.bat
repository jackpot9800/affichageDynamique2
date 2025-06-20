@echo off
echo 🔧 Réparation automatique du projet Presentation Kiosk (Windows)
echo ==============================================================

echo.
echo 📦 Nettoyage et réinstallation des dépendances...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
call npm install

if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo ✅ Dépendances installées avec succès

echo.
echo 📁 Vérification de la structure des dossiers...
if not exist hooks mkdir hooks
if not exist "app\(tabs)" mkdir "app\(tabs)"
if not exist components mkdir components
if not exist services mkdir services

echo.
echo 🔍 Vérification du hook useFrameworkReady...
if not exist "hooks\useFrameworkReady.ts" (
    echo ⚠️ Création du hook useFrameworkReady manquant...
    (
        echo import { useEffect } from 'react';
        echo.
        echo declare global {
        echo   interface Window {
        echo     frameworkReady?: ^(^) =^> void;
        echo   }
        echo }
        echo.
        echo export function useFrameworkReady^(^) {
        echo   useEffect^(^(^) =^> {
        echo     window.frameworkReady?.^(^);
        echo   }^);
        echo }
    ) > "hooks\useFrameworkReady.ts"
    echo ✅ Hook useFrameworkReady créé
) else (
    echo ✅ Hook useFrameworkReady présent
)

echo.
echo 🔍 Vérification des fichiers critiques...
if exist "app\_layout.tsx" (
    echo ✅ app\_layout.tsx présent
) else (
    echo ❌ app\_layout.tsx manquant
)

if exist "app\(tabs)\index.tsx" (
    echo ✅ app\^(tabs^)\index.tsx présent
) else (
    echo ❌ app\^(tabs^)\index.tsx manquant
)

if exist "services\ApiService.ts" (
    echo ✅ services\ApiService.ts présent
) else (
    echo ❌ services\ApiService.ts manquant
)

echo.
echo 📦 Vérification des dépendances critiques...
call npm list @react-native-async-storage/async-storage >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Installation de @react-native-async-storage/async-storage...
    call npm install @react-native-async-storage/async-storage
)

call npm list expo-linear-gradient >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Installation de expo-linear-gradient...
    call npm install expo-linear-gradient
)

call npm list lucide-react-native >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Installation de lucide-react-native...
    call npm install lucide-react-native
)

echo.
echo 🧹 Nettoyage du cache Expo...
call npx expo install --fix

echo.
echo ✅ Réparation terminée !
echo.
echo 🚀 Pour démarrer l'application :
echo    npx expo start --clear
echo.
echo 📱 Pour compiler pour Android :
echo    npx expo run:android
echo.
echo 🏗️ Pour build APK avec EAS :
echo    npm install -g @expo/eas-cli
echo    eas build --platform android
echo.
pause