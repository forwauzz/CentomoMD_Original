import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],

  // Ensure .env files are read from the frontend folder regardless of CWD
  envDir: path.resolve(process.cwd()),

  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },

  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  // Windows-specific optimizations
  optimizeDeps: {
    force: true,
  },
  
  // Use a different cache directory to avoid permission issues
  cacheDir: 'node_modules/.vite-cache',
});
