import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'api/index': 'src/api/index.ts',
    'utils/index': 'src/utils/index.ts',
    'design/index': 'src/design/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@supabase/supabase-js',
    '@tanstack/react-query',
    'react',
    'react-native'
  ]
});