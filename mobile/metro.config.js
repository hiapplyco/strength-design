const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { resolve } = require('metro-resolver');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { serializer } = config;

  const originalProcessModuleFilter = serializer?.processModuleFilter;
  const aliasMap = {
    'event-target-shim/index': path.resolve(
      __dirname,
      'shims/event-target-shim-index.js'
    ),
  };

  config.serializer = {
    ...serializer,
    processModuleFilter(module) {
      if (!module?.path) {
        console.warn('[metro] Skipping module with undefined path:', {
          id: module?.id,
          name: module?.name,
          outputType: module?.output?.[0]?.type,
        });
        if (module && module.output?.[0]) {
          if (!module.output[0].data) {
            module.output[0].data = {};
          }
          module.output[0].data.path = '__invalid__/unknown';
        }
        return false;
      }

      if (module.output?.[0]) {
        const data = module.output[0].data = module.output[0].data || {};
        if (!data.path) {
          data.path = path.relative(__dirname, module.path);
        }
      }

      return originalProcessModuleFilter ? originalProcessModuleFilter(module) : true;
    },
  };

  config.resolver = {
    ...config.resolver,
    resolveRequest(context, moduleName, platform, realModuleName) {
      const normalizedName = realModuleName || moduleName;
      if (aliasMap[normalizedName]) {
        return {
          type: 'sourceFile',
          filePath: aliasMap[normalizedName],
        };
      }
      return resolve(context, moduleName, platform, realModuleName);
    },
  };

  return config;
})();
