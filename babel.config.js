module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'react',
          web: { 
            unstable_transformProfile: 'hermes-stable',
            // Forcer la compilation TypeScript
            useTransformReactJSXExperimental: true
          }
        }
      ]
    ],
    plugins: [
      // Plugin pour gérer les imports TypeScript
      ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
      // Required for expo-router
      'expo-router/babel',
      // Required for react-native-reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};