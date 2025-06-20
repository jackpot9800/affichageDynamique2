#!/bin/bash

echo "🔧 Configuration automatique pour build Android Fire TV"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
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

# Vérifier si Android SDK est installé
print_status "Vérification de l'installation Android SDK..."
if ! command -v adb &> /dev/null; then
    print_error "Android SDK non trouvé!"
    print_warning "Veuillez installer Android Studio depuis: https://developer.android.com/studio"
    print_warning "Puis configurez les variables d'environnement ANDROID_HOME et PATH"
    exit 1
fi

print_success "Android SDK trouvé: $(which adb)"

# Vérifier ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME n'est pas défini"
    print_warning "Ajoutez ceci à votre ~/.bashrc ou ~/.zshrc:"
    print_warning "export ANDROID_HOME=\$HOME/Android/Sdk"
    print_warning "export PATH=\$PATH:\$ANDROID_HOME/emulator:\$ANDROID_HOME/tools:\$ANDROID_HOME/tools/bin:\$ANDROID_HOME/platform-tools"
else
    print_success "ANDROID_HOME: $ANDROID_HOME"
fi

# Vérifier les émulateurs disponibles
print_status "Vérification des émulateurs disponibles..."
EMULATORS=$(emulator -list-avds 2>/dev/null)
if [ -z "$EMULATORS" ]; then
    print_warning "Aucun émulateur trouvé"
    
    # Proposer de créer un émulateur Fire TV
    echo ""
    echo "Voulez-vous créer un émulateur Fire TV automatiquement? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Création de l'émulateur Fire TV..."
        
        # Vérifier si l'image système est disponible
        if sdkmanager --list | grep -q "system-images;android-30;google_apis;x86_64"; then
            # Installer l'image système si nécessaire
            print_status "Installation de l'image système Android 30..."
            sdkmanager "system-images;android-30;google_apis;x86_64"
            
            # Créer l'émulateur
            print_status "Création de l'émulateur FireTV_Auto..."
            echo "no" | avdmanager create avd -n FireTV_Auto -k "system-images;android-30;google_apis;x86_64" -d "tv_1080p" --force
            
            print_success "Émulateur FireTV_Auto créé avec succès!"
        else
            print_error "Image système Android 30 non disponible"
            print_warning "Installez-la via Android Studio SDK Manager"
        fi
    fi
else
    print_success "Émulateurs disponibles:"
    echo "$EMULATORS" | while read -r line; do
        echo "  - $line"
    done
fi

# Vérifier les appareils connectés
print_status "Vérification des appareils connectés..."
DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$")
if [ -z "$DEVICES" ]; then
    print_warning "Aucun appareil connecté"
    
    # Proposer de démarrer un émulateur
    if [ ! -z "$EMULATORS" ]; then
        echo ""
        echo "Voulez-vous démarrer un émulateur? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            # Prendre le premier émulateur disponible
            FIRST_EMULATOR=$(echo "$EMULATORS" | head -n 1)
            print_status "Démarrage de l'émulateur: $FIRST_EMULATOR"
            emulator -avd "$FIRST_EMULATOR" &
            
            print_status "Attente du démarrage de l'émulateur..."
            adb wait-for-device
            print_success "Émulateur démarré et prêt!"
        fi
    fi
else
    print_success "Appareils connectés:"
    echo "$DEVICES" | while read -r line; do
        if [ ! -z "$line" ]; then
            echo "  - $line"
        fi
    done
fi

# Vérifier les dépendances npm
print_status "Vérification des dépendances npm..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules non trouvé, installation des dépendances..."
    npm install
    print_success "Dépendances installées!"
else
    print_success "Dépendances npm présentes"
fi

# Proposer différentes options de build
echo ""
echo "=================================================="
echo "🚀 Options de build disponibles:"
echo "=================================================="
echo "1. Build local avec émulateur/appareil (expo run:android)"
echo "2. Build cloud avec EAS (eas build)"
echo "3. Prebuild seulement (expo prebuild)"
echo "4. Quitter"
echo ""
echo "Choisissez une option (1-4):"
read -r choice

case $choice in
    1)
        print_status "Lancement du build local..."
        npx expo run:android --no-install --no-bundler
        ;;
    2)
        print_status "Vérification d'EAS CLI..."
        if ! command -v eas &> /dev/null; then
            print_warning "EAS CLI non trouvé, installation..."
            npm install -g @expo/eas-cli
        fi
        
        print_status "Lancement du build EAS..."
        eas build --platform android --profile production
        ;;
    3)
        print_status "Génération du projet Android natif..."
        npx expo prebuild --platform android
        print_success "Projet Android généré dans le dossier 'android/'"
        print_status "Vous pouvez maintenant ouvrir le projet dans Android Studio"
        ;;
    4)
        print_status "Au revoir!"
        exit 0
        ;;
    *)
        print_error "Option invalide"
        exit 1
        ;;
esac

print_success "Script terminé!"