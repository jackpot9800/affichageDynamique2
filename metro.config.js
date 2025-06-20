const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour résoudre les problèmes TypeScript avec Expo 53
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'svg'];

// Résoudre les problèmes avec les modules TypeScript
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');

// Configuration pour les modules TypeScript
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;