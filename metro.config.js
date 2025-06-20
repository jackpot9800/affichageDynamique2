const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure TypeScript files are properly handled
config.resolver.sourceExts.push('ts', 'tsx');

// Add support for .mjs files
config.resolver.sourceExts.push('mjs');

// Configure transformer for TypeScript
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  unstable_allowRequireContext: true,
};

// Ensure proper module resolution
config.resolver.platforms = ['native', 'web', 'default'];

module.exports = config;