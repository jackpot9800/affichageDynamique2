@echo off
echo 🔧 Solution complète EAS CLI - Windows
echo ====================================

echo.
echo 📋 Diagnostic du problème...

:: Vérifier la version de Node.js
echo 🔍 Version Node.js :
node --version
echo.

:: Vérifier la version de npm
echo 🔍 Version npm :
npm --version
echo.

:: Vérifier la configuration npm
echo 🔍 Registre npm actuel :
npm config get registry
echo.

echo 🔧 Étape 1: Nettoyage du cache npm...
call npm cache clean --force

echo.
echo 🔧 Étape 2: Vérification/correction du registre npm...
call npm config set registry https://registry.npmjs.org/

echo.
echo 🔧 Étape 3: Mise à jour de npm...
call npm install -g npm@latest

echo.
echo 🔧 Étape 4: Installation d'EAS CLI (méthode 1)...
call npm install -g @expo/eas-cli

if %errorlevel% neq 0 (
    echo ⚠️ Méthode 1 échouée, essai méthode 2...
    
    echo 🔧 Étape 5: Installation avec --force...
    call npm install -g @expo/eas-cli --force
    
    if %errorlevel% neq 0 (
        echo ⚠️ Méthode 2 échouée, essai méthode 3...
        
        echo 🔧 Étape 6: Installation avec registre alternatif...
        call npm install -g @expo/eas-cli --registry https://registry.npmjs.org/
        
        if %errorlevel% neq 0 (
            echo ❌ Toutes les méthodes d'installation ont échoué
            echo.
            echo 🔄 Solutions alternatives :
            echo 1. Utilisez npx : npx @expo/eas-cli build --platform android
            echo 2. Installez Expo CLI classique : npm install -g @expo/cli
            echo 3. Vérifiez votre connexion internet et proxy
            echo.
            goto :alternative_solutions
        )
    )
)

echo.
echo ✅ Vérification de l'installation...
call eas --version

if %errorlevel% neq 0 (
    echo ❌ EAS CLI installé mais non accessible
    echo 🔧 Redémarrage requis ou problème de PATH
    goto :alternative_solutions
)

echo.
echo 🎉 EAS CLI installé avec succès !
echo.
echo 🚀 Étapes suivantes :
echo 1. eas login
echo 2. eas build:configure
echo 3. eas build --platform android --profile production
echo.
goto :end

:alternative_solutions
echo.
echo 🔄 SOLUTIONS ALTERNATIVES :
echo.
echo === Option 1: Utiliser npx (recommandé) ===
echo npx @expo/eas-cli login
echo npx @expo/eas-cli build:configure
echo npx @expo/eas-cli build --platform android --profile production
echo.
echo === Option 2: Expo CLI classique ===
echo npm install -g @expo/cli
echo npx create-expo-app --template
echo.
echo === Option 3: Build local avec Android Studio ===
echo npx expo run:android
echo.
echo === Option 4: Vérifications système ===
echo - Redémarrez PowerShell en tant qu'administrateur
echo - Vérifiez votre connexion internet
echo - Désactivez temporairement l'antivirus
echo - Vérifiez les paramètres de proxy d'entreprise
echo.

:end
pause