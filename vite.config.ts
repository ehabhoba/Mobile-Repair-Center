
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Using a global constant for stability
    '__AI_KEYS__': JSON.stringify([
      "AIzaSyD-JqnQKSX4dX-QKSul2bMoSjylnlmmiR0", // Key 5 (High Priority)
      "AIzaSyAK3LA-F1e7u0dxCZkVKTzfSR0AdO2ZHCU", // Key 1
      "AIzaSyB6jnqtwtZ-p2G_8D9KMhvhlNywwLhw3HQ", // Key 2
      "AIzaSyAXccWf2TjqeOtynlrb0-2wTtl8GI76Br8", // Key 3
      "AIzaSyDIOaVEEaKlxBzE4cZDO2Io-Ne8IE3-oHQ"  // Key 4
    ]),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});
