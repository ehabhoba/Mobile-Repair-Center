import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Hardcoded key to ensure 100% functionality immediately after deployment as requested
    'process.env.API_KEY': JSON.stringify("AIzaSyAK3LA-F1e7u0dxCZkVKTzfSR0AdO2ZHCU"),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});