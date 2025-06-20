const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuration spéciale pour gérer les fichiers TypeScript d'Expo
config.resolver.sourceExts = [
  'expo.ts',
  'expo.tsx',
  'expo.js',
  'expo.jsx',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'wasm',
  'mjs'
];

// Configuration du transformer pour TypeScript
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  unstable_allowRequireContext: true,
  // Forcer la transformation des fichiers TypeScript
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Résolution des modules avec priorité pour les fichiers compilés
config.resolver.platforms = ['native', 'web', 'default'];

// Gestion spéciale pour expo-modules-core
config.resolver.alias = {
  ...config.resolver.alias,
  // Forcer l'utilisation des fichiers JS compilés au lieu des TS
  'expo-modules-core': path.resolve(__dirname, 'node_modules/expo-modules-core/build'),
};

// Configuration pour ignorer les fichiers TypeScript problématiques
config.resolver.blacklistRE = /node_modules\/expo-modules-core\/src\/.*\.ts$/;

module.exports = config;