module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin for pose analysis animations
      'react-native-reanimated/plugin',
      // Optional: Transform runtime for better performance
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: false,
      }],
      // Support for ML Kit and pose detection
      ['babel-plugin-transform-imports', {
        '@react-native-ml-kit/pose-detection': {
          transform: '@react-native-ml-kit/pose-detection/lib/${member}',
          preventFullImport: true
        }
      }]
    ]
  };
};