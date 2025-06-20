const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration simplifiée pour éviter les conflits TypeScript
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

module.exports = config;