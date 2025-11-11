const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { serializer } = config;

  const originalProcessModuleFilter = serializer?.processModuleFilter;

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

  return config;
})();
