import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // allow external access
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'studionexa.online',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
});
