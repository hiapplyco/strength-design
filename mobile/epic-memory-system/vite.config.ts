
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5173,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    GOOGLE_ADS_ID: `'AW-11083056303'`,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase modules
          if (id.includes('node_modules/firebase/')) {
            return 'firebase';
          }
          
          // UI libraries
          if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/framer-motion/')) {
            return 'ui-lib';
          }
          
          // Chart libraries
          if (id.includes('node_modules/recharts/')) {
            return 'charts';
          }
          
          // Editor libraries
          if (id.includes('node_modules/@tiptap/')) {
            return 'editor';
          }
          
          // Query libraries
          if (id.includes('node_modules/@tanstack/')) {
            return 'query';
          }
          
          // Calendar libraries
          if (id.includes('node_modules/@fullcalendar/') || 
              id.includes('node_modules/react-big-calendar/') ||
              id.includes('node_modules/date-fns/')) {
            return 'calendar';
          }
          
          // Core React vendor
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router/')) {
            return 'vendor';
          }
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: mode === 'development'
  }
}));
