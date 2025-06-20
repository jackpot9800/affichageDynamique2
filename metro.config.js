const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure TypeScript files are handled correctly
config.resolver.sourceExts.push('ts', 'tsx');

// Add support for .mjs files
config.resolver.sourceExts.push('mjs');

module.exports = config;