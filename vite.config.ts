import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Using a global constant instead of process.env to avoid browser reference errors
    '__AI_KEYS__': JSON.stringify([
      "AIzaSyD-JqnQKSX4dX-QKSul2bMoSjylnlmmiR0",
      "AIzaSyAK3LA-F1e7u0dxCZkVKTzfSR0AdO2ZHCU",
      "AIzaSyB6jnqtwtZ-p2G_8D9KMhvhlNywwLhw3HQ",
      "AIzaSyAXccWf2TjqeOtynlrb0-2wTtl8GI76Br8",
      "AIzaSyDIOaVEEaKlxBzE4cZDO2Io-Ne8IE3-oHQ"
    ]),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});