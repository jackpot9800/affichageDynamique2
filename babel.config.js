module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxImportSource: 'react',
        web: { unstable_transformProfile: 'hermes-stable' }
      }]
    ],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // Required for react-native-reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};