import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Set up alias for the src folder
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://chatterbox-backend-rus5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
