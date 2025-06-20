const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration TypeScript améliorée
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'otf', 'woff', 'woff2'];

// Configuration des plateformes
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Configuration du transformer pour résoudre les problèmes TypeScript
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

// Résolution des modules améliorée
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

// Configuration spécifique pour Expo 52
config.resolver.unstable_enableSymlinks = false;
config.resolver.unstable_enablePackageExports = false;

module.exports = config;