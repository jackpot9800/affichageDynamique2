#!/bin/bash
echo "🔧 Réparation automatique du projet Presentation Kiosk"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Êtes-vous dans le bon dossier ?"
    exit 1
fi

print_status "Nettoyage et réinstallation des dépendances..."
rm -rf node_modules
rm -f package-lock.json
npm install

if [ $? -eq 0 ]; then
    print_success "Dépendances installées avec succès"
else
    print_error "Erreur lors de l'installation des dépendances"
    exit 1
fi

# Vérifier et créer les dossiers nécessaires
print_status "Vérification de la structure des dossiers..."
mkdir -p hooks
mkdir -p app/(tabs)
mkdir -p components
mkdir -p services

# Créer le hook useFrameworkReady si manquant
if [ ! -f "hooks/useFrameworkReady.ts" ]; then
    print_warning "Création du hook useFrameworkReady manquant..."
    cat > hooks/useFrameworkReady.ts << 'EOF'
import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    window.frameworkReady?.();
  });
}
EOF
    print_success "Hook useFrameworkReady créé"
else
    print_success "Hook useFrameworkReady présent"
fi

# Vérifier les fichiers critiques
print_status "Vérification des fichiers critiques..."

CRITICAL_FILES=(
    "app/_layout.tsx"
    "app/(tabs)/_layout.tsx"
    "app/(tabs)/index.tsx"
    "services/ApiService.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_error "✗ $file manquant"
    fi
done

# Vérifier les dépendances critiques
print_status "Vérification des dépendances critiques..."

CRITICAL_DEPS=(
    "@react-native-async-storage/async-storage"
    "expo-linear-gradient"
    "lucide-react-native"
    "expo-router"
)

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" &> /dev/null; then
        print_success "✓ $dep installé"
    else
        print_warning "✗ $dep manquant, installation..."
        npm install "$dep"
    fi
done

# Nettoyer le cache Expo
print_status "Nettoyage du cache Expo..."
npx expo install --fix

print_success "Réparation terminée !"
print_status "Vous pouvez maintenant démarrer l'application avec:"
echo "  npx expo start --clear"
echo ""
print_status "Pour compiler pour Android:"
echo "  npx expo run:android"
echo ""
print_status "Pour build APK avec EAS:"
echo "  npm install -g @expo/eas-cli"
echo "  eas build --platform android"