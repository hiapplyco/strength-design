const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// For Expo SDK 53 compatibility, ensure package.json exports are handled properly
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true, // Enable package.json exports (default in RN 0.79/Expo 53)
};

module.exports = config;