# 🔧 Solution : Écran blanc après export ZIP

## 🚨 Problème identifié
Après avoir téléchargé le ZIP et ouvert le projet, l'application démarre mais reste blanche. Cela arrive car plusieurs éléments critiques ne sont pas configurés correctement.

## ✅ Solution complète étape par étape

### Étape 1: Vérification des dépendances manquantes
```bash
# Naviguez vers le dossier du projet
cd presentation-kiosk

# Installez TOUTES les dépendances
npm install

# Vérifiez que ces dépendances critiques sont installées
npm list @react-native-async-storage/async-storage
npm list expo-linear-gradient
npm list lucide-react-native
```

### Étape 2: Configuration du hook critique
Le fichier `hooks/useFrameworkReady.ts` est ESSENTIEL et doit être présent :

```typescript
// hooks/useFrameworkReady.ts
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
```

### Étape 3: Vérification du layout principal
Le fichier `app/_layout.tsx` doit contenir le hook useFrameworkReady :

```typescript
// app/_layout.tsx - CRITIQUE !
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady(); // CETTE LIGNE EST CRITIQUE !

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="presentation/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
```

### Étape 4: Initialisation du service API
Le problème principal est que l'ApiService n'est pas initialisé. Modifiez `app/(tabs)/index.tsx` :

```typescript
// Dans app/(tabs)/index.tsx, ajoutez cette initialisation
useEffect(() => {
  const initializeApp = async () => {
    setLoading(true);
    
    // CRITIQUE: Initialiser le service API
    await apiService.initialize();
    
    // Vérifier si l'URL du serveur est configurée
    const serverUrl = apiService.getServerUrl();
    if (!serverUrl) {
      setConnectionStatus('not_configured');
      setLoading(false);
      return;
    }
    
    await checkConnection();
    await loadPresentations();
    setLoading(false);
  };

  initializeApp();
}, []);
```

### Étape 5: Démarrage correct du serveur de développement
```bash
# Utilisez cette commande spécifique
npx expo start --web

# OU pour un démarrage complet
npx expo start --clear
```

### Étape 6: Vérification des erreurs dans la console
1. Ouvrez les outils de développement (F12)
2. Regardez l'onglet Console pour les erreurs
3. Regardez l'onglet Network pour les requêtes échouées

## 🔍 Diagnostic des problèmes courants

### Problème 1: "Cannot resolve module"
```bash
# Solution
rm -rf node_modules
rm package-lock.json
npm install
```

### Problème 2: "useFrameworkReady is not defined"
```bash
# Vérifiez que le fichier existe
ls -la hooks/useFrameworkReady.ts

# Si absent, créez-le avec le contenu ci-dessus
```

### Problème 3: "AsyncStorage not found"
```bash
# Installez la dépendance manquante
npm install @react-native-async-storage/async-storage
```

### Problème 4: Erreurs de routing
```bash
# Vérifiez la structure des dossiers
ls -la app/
ls -la app/(tabs)/
```

## 🚀 Script de réparation automatique

Créez ce script `fix-project.sh` :

```bash
#!/bin/bash
echo "🔧 Réparation automatique du projet"

# Nettoyer et réinstaller
echo "📦 Nettoyage et réinstallation..."
rm -rf node_modules
rm -f package-lock.json
npm install

# Vérifier les fichiers critiques
echo "🔍 Vérification des fichiers critiques..."

# Créer le hook si manquant
if [ ! -f "hooks/useFrameworkReady.ts" ]; then
    echo "⚠️ Création du hook useFrameworkReady manquant..."
    mkdir -p hooks
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
fi

# Vérifier la structure des dossiers
echo "📁 Vérification de la structure..."
mkdir -p app/(tabs)
mkdir -p components
mkdir -p services

# Démarrer le serveur
echo "🚀 Démarrage du serveur..."
npx expo start --clear
```

## 🎯 Test de validation

Après avoir appliqué les corrections :

1. **Test 1**: L'application démarre sans erreur
2. **Test 2**: Vous voyez l'écran d'accueil avec "Kiosque de Présentations"
3. **Test 3**: Les onglets en bas sont visibles
4. **Test 4**: Vous pouvez naviguer entre les onglets
5. **Test 5**: Dans Paramètres, vous pouvez configurer l'URL du serveur

## 📱 Configuration pour Fire TV

Une fois que l'application fonctionne en web, pour la compiler pour Fire TV :

```bash
# Générer le projet Android
npx expo run:android --no-install --no-bundler

# Ou utiliser EAS Build
npm install -g @expo/eas-cli
eas build --platform android --profile production
```

## 🆘 Si le problème persiste

1. **Vérifiez la console du navigateur** pour les erreurs JavaScript
2. **Vérifiez que tous les fichiers sont présents** dans le ZIP téléchargé
3. **Utilisez la version Node.js recommandée** (18.x ou 20.x)
4. **Désactivez temporairement l'antivirus** qui pourrait bloquer certains fichiers

## 📞 Commandes de diagnostic

```bash
# Vérifier la version de Node
node --version

# Vérifier Expo CLI
npx expo --version

# Lister les dépendances installées
npm list --depth=0

# Vérifier les erreurs Metro
npx expo start --clear --verbose
```

La cause principale de l'écran blanc est généralement l'absence du hook `useFrameworkReady` ou une mauvaise initialisation de l'ApiService. Suivez ces étapes dans l'ordre et votre application devrait fonctionner ! 🚀