module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }]
    ],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // Required for react-native-reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};