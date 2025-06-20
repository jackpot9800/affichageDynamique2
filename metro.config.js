const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Résoudre les problèmes TypeScript avec Expo 53
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'otf', 'woff', 'woff2'];

// Configuration pour les plateformes
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Configuration du transformer pour TypeScript
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Résoudre les modules node_modules
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

module.exports = config;