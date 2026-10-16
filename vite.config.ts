import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    proxy: loadEnv(mode, process.cwd()).VITE_DEMO_MODE === 'true' ? {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        headers: { origin: 'http://localhost:3010' },
      },
    } : undefined,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
