const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// For Expo SDK 53 compatibility, ensure package.json exports are handled properly
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true, // Enable package.json exports (default in RN 0.79/Expo 53)
  // Add support for pose analysis video processing
  assetExts: [...config.resolver.assetExts, 'mp4', 'mov', 'avi', 'mkv', 'webm'],
  // Add support for TypeScript in pose detection services
  sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx'],
  // Ignore ML Kit native modules in web builds
  platforms: ['ios', 'android', 'native', 'web']
};

// Add transform options for better performance
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;