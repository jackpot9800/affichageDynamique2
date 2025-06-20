# 🔍 Guide de diagnostic - Écran blanc

## 🚨 Symptômes de l'écran blanc

- L'application se lance mais affiche un écran blanc
- Aucune erreur visible dans l'interface
- Le serveur de développement semble fonctionner

## 🔧 Étapes de diagnostic

### 1. Vérifier la console du navigateur
```
F12 → Console
```
Recherchez les erreurs JavaScript, notamment :
- `Cannot resolve module`
- `useFrameworkReady is not defined`
- `AsyncStorage is not available`

### 2. Vérifier les fichiers critiques
```bash
# Vérifier la présence des fichiers essentiels
ls -la hooks/useFrameworkReady.ts
ls -la app/_layout.tsx
ls -la app/(tabs)/index.tsx
ls -la services/ApiService.ts
```

### 3. Vérifier les dépendances
```bash
# Lister les dépendances installées
npm list --depth=0

# Vérifier les dépendances critiques
npm list @react-native-async-storage/async-storage
npm list expo-linear-gradient
npm list lucide-react-native
```

### 4. Vérifier la configuration Expo
```bash
# Vérifier la version d'Expo
npx expo --version

# Vérifier la configuration
cat app.json
```

## 🛠️ Solutions par type d'erreur

### Erreur: "Cannot resolve module '@/hooks/useFrameworkReady'"
**Solution :**
```bash
# Créer le fichier manquant
mkdir -p hooks
# Copier le contenu depuis SOLUTION_ECRAN_BLANC.md
```

### Erreur: "AsyncStorage is not available"
**Solution :**
```bash
npm install @react-native-async-storage/async-storage
```

### Erreur: "Module not found: lucide-react-native"
**Solution :**
```bash
npm install lucide-react-native
```

### Erreur: "expo-linear-gradient not found"
**Solution :**
```bash
npm install expo-linear-gradient
```

## 🚀 Script de diagnostic automatique

```bash
#!/bin/bash
echo "🔍 Diagnostic automatique"

echo "1. Vérification de Node.js:"
node --version

echo "2. Vérification d'Expo:"
npx expo --version

echo "3. Vérification des fichiers critiques:"
[ -f "hooks/useFrameworkReady.ts" ] && echo "✓ useFrameworkReady.ts" || echo "✗ useFrameworkReady.ts MANQUANT"
[ -f "app/_layout.tsx" ] && echo "✓ _layout.tsx" || echo "✗ _layout.tsx MANQUANT"
[ -f "services/ApiService.ts" ] && echo "✓ ApiService.ts" || echo "✗ ApiService.ts MANQUANT"

echo "4. Vérification des dépendances:"
npm list @react-native-async-storage/async-storage &> /dev/null && echo "✓ AsyncStorage" || echo "✗ AsyncStorage MANQUANT"
npm list expo-linear-gradient &> /dev/null && echo "✓ LinearGradient" || echo "✗ LinearGradient MANQUANT"
npm list lucide-react-native &> /dev/null && echo "✓ Lucide Icons" || echo "✗ Lucide Icons MANQUANT"

echo "5. Test de démarrage:"
timeout 10s npx expo start --web &> /dev/null && echo "✓ Expo démarre" || echo "✗ Problème de démarrage Expo"
```

## 📱 Test de validation

Après correction, vérifiez que :

1. **Console propre** : Aucune erreur rouge dans F12
2. **Navigation** : Les onglets en bas sont visibles et cliquables
3. **Contenu** : Vous voyez "Kiosque de Présentations" sur l'écran d'accueil
4. **Paramètres** : L'onglet Paramètres s'ouvre correctement
5. **API Service** : Vous pouvez configurer l'URL du serveur

## 🆘 Si le problème persiste

1. **Supprimez complètement le projet** et re-téléchargez le ZIP
2. **Utilisez le script fix-project.sh** pour une réparation automatique
3. **Vérifiez votre version de Node.js** (recommandé: 18.x ou 20.x)
4. **Désactivez temporairement l'antivirus** qui pourrait bloquer des fichiers
5. **Essayez dans un navigateur différent** (Chrome, Firefox, Safari)

La plupart des problèmes d'écran blanc sont dus à des fichiers manquants ou des dépendances non installées. Le script de réparation devrait résoudre 90% des cas ! 🚀