const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour gérer les extensions TypeScript
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs'];

// Configuration pour les transformations
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Configuration pour résoudre les modules
config.resolver.platforms = ['native', 'web', 'default'];

module.exports = config;